# syntax=docker/dockerfile:1

FROM node:24.19.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_CONFIG_CACHE_DIR="/pnpm/cache"
ENV PNPM_CONFIG_FETCH_RETRIES="5"
ENV PNPM_CONFIG_FETCH_RETRY_MINTIMEOUT="10000"
ENV PNPM_CONFIG_FETCH_RETRY_MAXTIMEOUT="60000"
ENV PNPM_CONFIG_FETCH_TIMEOUT="120000"
ENV PNPM_CONFIG_NETWORK_CONCURRENCY="8"

RUN corepack enable
WORKDIR /app

FROM base AS builder

ARG API_INTERNAL_URL=http://api:3001
ARG NEXT_PUBLIC_APP_NAME="SIPAT"
ARG NEXT_PUBLIC_APP_ENV=production

ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY packages/config ./packages/config
COPY packages/contracts ./packages/contracts

RUN --mount=type=cache,id=sipat-pnpm-store,target=/pnpm/store,sharing=locked \
    --mount=type=cache,id=sipat-pnpm-cache,target=/pnpm/cache,sharing=locked \
    pnpm install --frozen-lockfile --filter @repo/web...
RUN pnpm --filter @repo/web build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
