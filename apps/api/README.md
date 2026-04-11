# WaveStream API

**Language:** English | [Tiếng Việt](./README.vi.md)

WaveStream API is the NestJS backend for the music streaming demo. It serves auth, tracks, playlists, discovery, notifications, analytics, and moderation endpoints.

## Quick Start

```bash
pnpm install
pnpm start:dev
```

## Scripts

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm migration:run
pnpm migration:revert
pnpm migration:show
pnpm seed
```

## Ownership Map

- `src/main.ts` wires the Nest runtime, global middleware, Swagger, CORS, and validation.
- `src/modules/` contains the domain modules for auth, tracks, playlists, discovery, analytics, admin, and notifications.
- `src/database/` holds the TypeORM configuration, entities, migrations, and seed entrypoints.
- `test/` contains API integration coverage and end-to-end test setup.

## Notes

- Requires the repo-level environment and services configured in `docker-compose.yml`.
- API docs and health checks are available from the running service once the server is up.
- Keep secrets out of source files; use environment variables for local and production values.
