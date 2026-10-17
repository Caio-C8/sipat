# syntax=docker/dockerfile:1

FROM node:24.19.0-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV PNPM_CONFIG_CACHE_DIR="/pnpm/cache"
ENV PNPM_CONFIG_FETCH_RETRIES="5"
ENV PNPM_CONFIG_FETCH_RETRY_MINTIMEOUT="10000"
ENV PNPM_CONFIG_FETCH_RETRY_MAXTIMEOUT="60000"
ENV PNPM_CONFIG_FETCH_TIMEOUT="120000"
ENV PNPM_CONFIG_NETWORK_CONCURRENCY="8"

RUN corepack enable
WORKDIR /app

ARG EXPO_PUBLIC_APP_NAME="SIPAT"
ARG EXPO_PUBLIC_APP_ENV=production
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_API_PORT=3001

ENV EXPO_PUBLIC_APP_NAME=$EXPO_PUBLIC_APP_NAME
ENV EXPO_PUBLIC_APP_ENV=$EXPO_PUBLIC_APP_ENV
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_PORT=$EXPO_PUBLIC_API_PORT

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps/mobile ./apps/mobile
COPY packages/config ./packages/config
COPY packages/contracts ./packages/contracts

RUN --mount=type=cache,id=sipat-pnpm-store,target=/pnpm/store,sharing=locked \
    --mount=type=cache,id=sipat-pnpm-cache,target=/pnpm/cache,sharing=locked \
    pnpm install --frozen-lockfile --filter @repo/mobile...
RUN pnpm --filter @repo/mobile exec expo export --platform web --output-dir dist/web

FROM nginx:1.30.6-alpine AS runtime

COPY docker/mobile-web.nginx.conf /etc/nginx/nginx.conf

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]

FROM runtime AS ci

COPY --chown=nginx:nginx apps/mobile/dist/web /usr/share/nginx/html

FROM runtime AS runner

COPY --from=builder --chown=nginx:nginx /app/apps/mobile/dist/web /usr/share/nginx/html
