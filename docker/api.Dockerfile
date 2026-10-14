FROM node:24.19.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /app

FROM base AS dependencies

COPY . .
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

RUN pnpm --filter @repo/database db:generate
RUN pnpm --filter @repo/api build
RUN pnpm --filter @repo/api deploy --prod /prod/api

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
