# WaveStream

[![CI](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/ci.yml/badge.svg)](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/ci.yml)
[![CD](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/cd.yml/badge.svg)](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/cd.yml)

English | [Tiếng Việt](./README.vi.md)

WaveStream is a portfolio-grade music streaming platform built as a pnpm monorepo. It combines a Next.js App Router frontend, a NestJS API, PostgreSQL, Redis, MinIO, and Mailpit into a Docker-first local stack that feels close to a real product rather than a starter template.

## Portfolio Note

This project is part of the portfolio of Nguyễn Sơn. For feedback, collaboration ideas, or portfolio inquiries, you can reach out at `jasonbmt06@gmail.com`.

WaveStream is built for learning and portfolio purposes. Feedback, suggestions, and constructive contributions are always welcome.

## What's Included

- Listener experience with discovery, search, track playback, playlists, follows, likes, reposts, and comments.
- Creator tools for uploads, owned-track management, and dashboard analytics.
- Admin moderation with report review, target previews, and audit-friendly actions.
- Secure auth with access tokens, refresh-cookie rotation, password reset, and protected routes.
- Persistent audio player, queue state, and route-safe playback behavior.

## Monorepo Architecture

- `apps/web`: Next.js frontend with the public site, auth shell, app shell, and player/runtime state.
- `apps/api`: NestJS API for auth, tracks, playlists, discovery, admin, analytics, storage, and health checks.
- `packages/shared`: shared enums, DTOs, pagination contracts, and cross-app validation helpers.
- `docker-compose.yml`: the local orchestration file for the full app stack.
- `docker/`: production-oriented Dockerfiles for the web and API services.

## Local Startup

1. Copy `.env.example` to `.env` and keep the local defaults unless your machine already uses one of the mapped ports.
2. Run `pnpm install`.
3. Start the full stack with `docker compose up --build`.
4. Open the key services:
   - Web: `http://localhost:3000`
   - API health: `http://localhost:4000/api/health`
   - Mailpit inbox: `http://localhost:8025`
   - MinIO console: `http://localhost:9001`
   - PostgreSQL host port: `localhost:5433` by default

The compose stack starts PostgreSQL, Redis, MinIO, Mailpit, API migrations, API seed data, the API service, and the web app in the right order.

## Seeded Accounts

- Admin: `admin@wavestream.local` / `Admin123!`
- Creator: `solis@wavestream.demo` / `DemoPass123!`
- Listener: `ivy@wavestream.demo` / `DemoPass123!`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
pnpm smoke:docker
```

## Docker Workflow

- `docker compose up --build` boots the complete local environment from scratch.
- `docker compose down -v --remove-orphans` tears everything down and removes volumes if you want a clean reset.
- The API container runs migrations and seed data through the compose dependency chain, so a fresh stack comes up with demo content already populated.

## Environment

The canonical environment template is `.env.example`. The main groups are:

- `DB_*` for PostgreSQL connectivity and credentials.
- `REDIS_*` for rate limiting and cache behavior.
- `MINIO_*` for object storage and generated media URLs.
- `JWT_*` for access and refresh token signing.
- `SMTP_*` for Mailpit or a real mail provider.
- `ADMIN_*` for the seeded admin account.
- `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, and `INTERNAL_API_URL` for web/API routing.

## CI/CD

- CI validates install, lint, typecheck, test, build, Playwright end-to-end coverage, and the Docker smoke path from `.github/workflows/ci.yml`.
- CD publishes container images to GitHub Container Registry from `.github/workflows/cd.yml`.
- Canonical image names:
  - `ghcr.io/jasontm17/wavestream-web`
  - `ghcr.io/jasontm17/wavestream-api`

## Suggested Demo Path

1. Open the landing page and point out the public discovery rails.
2. Sign in as the creator account and show the persistent player, library, and creator dashboard.
3. Open a track page, demonstrate like, repost, comment, and add-to-playlist actions.
4. Visit the playlist page and show add, reorder, edit, and delete controls for the owner.
5. Sign in as the admin account and show the moderation queue with target previews.
6. Open Mailpit to show the password-reset flow is wired end to end.

## Further Reading

- [Project blurbs for CV and LinkedIn](./docs/PROJECT-BLURBS.md)
- [Project blurbs for CV and LinkedIn - Vietnamese](./docs/PROJECT-BLURBS.vi.md)
- [Project summary](./docs/PROJECT-SUMMARY.md)
- [Project summary - Vietnamese](./docs/PROJECT-SUMMARY.vi.md)
- [Portfolio case study](./docs/CASE-STUDY.md)
- [Portfolio case study - Vietnamese](./docs/CASE-STUDY.vi.md)
- [Deployment guide](./docs/DEPLOYMENT.md)
- [Deployment guide - Vietnamese](./docs/DEPLOYMENT.vi.md)
- [Demo walkthrough](./docs/DEMO-WALKTHROUGH.md)
- [Demo walkthrough - Vietnamese](./docs/DEMO-WALKTHROUGH.vi.md)
