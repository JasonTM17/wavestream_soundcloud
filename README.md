# WaveStream

WaveStream is a production-minded music streaming demo built as a pnpm monorepo with a Next.js frontend, a NestJS API, PostgreSQL, Redis, MinIO, and Mailpit.

## Stack

- `apps/web`: Next.js app router frontend
- `apps/api`: NestJS API with PostgreSQL, Redis, MinIO, and SMTP mail delivery
- `packages/shared`: shared enums, contracts, and DTO helpers
- `docker-compose.yml`: local stack orchestration

## Quick Start

1. Copy `.env.example` to `.env` and keep the defaults for local development.
2. Run `pnpm install`.
3. Start the stack with `docker compose up --build`.
4. Open the apps:
   - Web: `http://localhost:3000`
   - API health: `http://localhost:4000/api/health`
   - Mailpit inbox: `http://localhost:8025`
   - MinIO console: `http://localhost:9001`
   - PostgreSQL host port: `localhost:5433` by default so it does not collide with an existing local Postgres instance

## Demo Accounts

- Admin: `admin@wavestream.local` / `Admin123!`
- Creator example: `solis@wavestream.demo` / `DemoPass123!`
- Listener example: `ivy@wavestream.demo` / `DemoPass123!`

## Local Services

- PostgreSQL stores the app data and migrations.
- Redis backs rate limiting and caching.
- MinIO stores uploaded audio and artwork.
- Mailpit captures reset-password and demo mail.

## Environment

Required variables live in `.env.example`. The most important ones are:

- `DB_*` for PostgreSQL
- `POSTGRES_HOST_PORT` if your machine already uses `5432`
- `REDIS_*` for Redis
- `MINIO_*` for object storage
- `JWT_*` for access and refresh tokens
- `SMTP_*` for Mailpit or a real SMTP server
- `ADMIN_*` for the seeded admin account

## Validation

For a full local verification pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
docker compose up --build -d
```

To reset the local stack and seeded database:

```bash
docker compose down -v --remove-orphans
```

## Notes

- Database migrations and seed data run through the compose stack before the API starts.
- The repository is intentionally split into small slices so infrastructure can be improved independently of app features.
