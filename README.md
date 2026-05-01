# WaveStream

[![CI](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/ci.yml/badge.svg)](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/ci.yml)
[![CD](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/cd.yml/badge.svg)](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/cd.yml)

English | [Tiếng Việt](./README.vi.md)

WaveStream is a portfolio-grade music streaming platform — a full-stack SoundCloud clone built from scratch as a pnpm monorepo. It combines a Next.js 16 App Router frontend, a NestJS 11 API, PostgreSQL, Redis, MinIO, and Mailpit into a Docker-first local stack that feels close to a real production product.

> **Portfolio project by [Nguyễn Sơn](mailto:jasonbmt06@gmail.com)** · [GitHub](https://github.com/JasonTM17/Wavestream_Soundcloud)

---

## About

WaveStream is designed to read like a production product, not only a feature demo. The project covers the core surfaces expected from a modern creator/listener music platform: public discovery, search, persistent playback, playlist workflows, creator publishing, role-based admin moderation, reporting, password recovery, object storage, background jobs, and CI/CD.

The demo catalog is not a silent mock. Seeded tracks upload generated artwork and legal, deterministic WAV audio into MinIO so the player, streaming route, queue, and playlists all run against real media files.

**Recommended GitHub About**

- Description: `Full-stack SoundCloud-inspired music platform built with Next.js 16, NestJS 11, PostgreSQL, Redis, MinIO, Docker, and GitHub Actions.`
- Topics: `nextjs`, `nestjs`, `typescript`, `soundcloud-clone`, `music-streaming`, `postgresql`, `redis`, `minio`, `docker`, `github-actions`, `portfolio-project`
- Website: deploy URL when available, or `/about` in the running app

See [docs/ABOUT.md](./docs/ABOUT.md) for the full project profile and
[docs/GITHUB_ABOUT.md](./docs/GITHUB_ABOUT.md) for a copy-ready GitHub repository profile.

---

## Features

| Area               | What's covered                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Listener**       | Discovery rails, search, persistent audio player, queue, playlists, likes, reposts, comments, follow |
| **Creator**        | Upload & manage tracks, creator dashboard with analytics                                             |
| **Admin**          | Report queue, content moderation (hide/restore), audit log, user role management                     |
| **Auth**           | JWT access tokens, refresh-cookie rotation, password reset via email, protected routes               |
| **Infrastructure** | Docker Compose full stack, GitHub Actions CI/CD, GHCR image publishing                               |

---

## Monorepo Structure

```
.
├── apps/
│   ├── web/          # Next.js 16 — landing, auth, app shell, player
│   └── api/          # NestJS 11 — auth, tracks, playlists, discovery, admin
├── packages/
│   └── shared/       # Shared DTOs, enums, and validation contracts
└── docker-compose.yml
```

---

## Tech Stack

**Frontend** · Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query, Zustand

**Backend** · NestJS 11, TypeORM, PostgreSQL 16, Redis 7, BullMQ, Socket.IO, JWT/Passport

**Storage & Infra** · MinIO (S3-compatible), Docker, GitHub Actions, GHCR

---

## Quick Start

### Prerequisites

- Node.js 20+, pnpm 10+, Docker

### Steps

```bash
# 1. Clone and install
git clone https://github.com/JasonTM17/Wavestream_Soundcloud.git
cd Wavestream_Soundcloud
pnpm install

# 2. Configure environment
cp .env.example .env
# The default values work for local Docker — no changes needed

# 3. Start the full stack
docker compose up --build
```

Services after startup:

| Service            | URL                              |
| ------------------ | -------------------------------- |
| Web app            | http://localhost:3000            |
| API health         | http://localhost:4000/api/health |
| API docs (Swagger) | http://localhost:4000/api/docs   |
| Mailpit inbox      | http://localhost:8025            |
| MinIO console      | http://localhost:9001            |

### Local Hostname Note

Keep the frontend and API on the same loopback hostname family during local work.

- Recommended: `http://localhost:3000` for web and `http://localhost:4000` for API
- Also supported: `http://127.0.0.1:3000` with `http://127.0.0.1:4000`
- Avoid mixing `localhost` for one app and `127.0.0.1` for the other when testing browser flows manually

WaveStream now hardens loopback API calls in the browser, but matching hosts still gives the most predictable cookies, CORS behavior, and smoke-test results.

---

## Demo Accounts

| Role     | Email                    | Password       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@wavestream.local` | `Admin123!`    |
| Creator  | `solis@wavestream.demo`  | `DemoPass123!` |
| Listener | `ivy@wavestream.demo`    | `DemoPass123!` |

---

## Development

Run everything locally without Docker:

```bash
pnpm dev          # Start web (port 3000) + API (port 4000) in watch mode
pnpm build        # Production build (both apps)
pnpm lint         # ESLint across all workspaces
pnpm typecheck    # TypeScript strict check
pnpm test         # Unit tests (Vitest + Jest)
pnpm test:e2e     # End-to-end tests (Playwright)
pnpm db:migrate   # Run pending TypeORM migrations
pnpm db:seed      # Seed demo data
pnpm smoke:docker # Docker smoke test
```

---

## Environment Reference

| Group    | Variables                                                                                    |
| -------- | -------------------------------------------------------------------------------------------- |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`                                    |
| Redis    | `REDIS_HOST`, `REDIS_PORT`                                                                   |
| MinIO    | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`     |
| JWT      | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| SMTP     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`                                                        |
| App      | `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`                                    |

See `.env.example` for all values with descriptions.

For a cleaner local setup matrix, loopback-host guidance, Docker notes, and Playwright runtime details, see [docs/LOCAL_RUN.md](./docs/LOCAL_RUN.md).
For production release readiness, use [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md).
For production host operations, branch protection, monitoring, logs, backups, and rollback, use [docs/PRODUCTION_OPERATIONS.md](./docs/PRODUCTION_OPERATIONS.md).
For dependency-audit policy and the TypeORM UUID compatibility patch, see [docs/SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md).
For a public-facing product and architecture summary, see [docs/ABOUT.md](./docs/ABOUT.md).
For the first public release copy, see [docs/RELEASE_NOTES_v1.0.0.md](./docs/RELEASE_NOTES_v1.0.0.md).

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): install → lint → typecheck → unit test → build → Playwright E2E → Docker smoke
- **CD** (`.github/workflows/cd.yml`): publishes Docker images to GHCR on merge to `main`

Container images:

- `ghcr.io/jasontm17/wavestream-web`
- `ghcr.io/jasontm17/wavestream-api`

---

## Demo Walkthrough

1. Open the landing page — browse public discovery rails without signing in.
2. Sign in as **Creator** → persistent player, library, creator dashboard.
3. Open a track → like, repost, comment, add to playlist.
4. Visit a playlist → reorder tracks, edit metadata (as owner).
5. Sign in as **Admin** → moderation queue, report review, user role management.
6. Open Mailpit at `http://localhost:8025` → password-reset email flow end-to-end.

---

## License

MIT — built for learning and portfolio purposes. Feedback and contributions are welcome.
