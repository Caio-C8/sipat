# syntax=docker/dockerfile:1

FROM node:24.22.1-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_CONFIG_CACHE_DIR="/pnpm/cache"
ENV PNPM_CONFIG_FETCH_RETRIES="5"
ENV PNPM_CONFIG_FETCH_RETRY_MINTIMEOUT="10000"
ENV PNPM_CONFIG_FETCH_RETRY_MAXTIMEOUT="60000"
ENV PNPM_CONFIG_FETCH_TIMEOUT="120000"
ENV PNPM_CONFIG_NETWORK_CONCURRENCY="8"

RUN corepack enable
WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps/api ./apps/api
COPY packages/config ./packages/config
COPY packages/contracts ./packages/contracts
COPY packages/database ./packages/database

RUN --mount=type=cache,id=sipat-pnpm-store,target=/pnpm/store,sharing=locked \
    --mount=type=cache,id=sipat-pnpm-cache,target=/pnpm/cache,sharing=locked \
    pnpm install --frozen-lockfile --filter @repo/api...

FROM dependencies AS builder

ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

RUN pnpm --filter @repo/database db:generate
RUN pnpm --filter @repo/api build
RUN --mount=type=cache,id=sipat-pnpm-store,target=/pnpm/store,sharing=locked \
    --mount=type=cache,id=sipat-pnpm-cache,target=/pnpm/cache,sharing=locked \
    pnpm --filter @repo/api deploy --prod /prod/api

FROM builder AS migration

CMD ["pnpm", "--filter", "@repo/database", "db:migrate:deploy"]

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 api

COPY --from=builder --chown=api:nodejs /prod/api ./
COPY --from=builder --chown=api:nodejs /app/apps/api/dist ./dist

USER api

EXPOSE 3001

CMD ["node", "dist/main.js"]
