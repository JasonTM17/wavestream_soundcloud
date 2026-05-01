FROM public.ecr.aws/docker/library/node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/uuid-compat/package.json ./packages/uuid-compat/
RUN pnpm install --frozen-lockfile || pnpm install

# Build shared package
FROM deps AS shared-build
COPY packages/shared/ ./packages/shared/
COPY packages/uuid-compat/ ./packages/uuid-compat/
RUN pnpm --filter @wavestream/shared build

# Build API
FROM shared-build AS build
COPY apps/api/ ./apps/api/
RUN pnpm --filter api build

# Production
FROM public.ecr.aws/docker/library/node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/uuid-compat ./packages/uuid-compat
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
