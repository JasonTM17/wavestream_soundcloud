FROM public.ecr.aws/docker/library/node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/uuid-compat/package.json ./packages/uuid-compat/
RUN pnpm install --frozen-lockfile || pnpm install

# Build shared
FROM deps AS shared-build
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter @wavestream/shared build

# Build web
FROM shared-build AS build
COPY apps/web/ ./apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p ./apps/web/public
RUN pnpm --filter web build

# Production
FROM public.ecr.aws/docker/library/node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
