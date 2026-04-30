# WaveStream v1.0.0 - Production-ready portfolio release

WaveStream v1.0.0 is the first portfolio-ready release of the project: a full-stack, SoundCloud-inspired music platform with real media playback, creator workflows, admin moderation, Dockerized infrastructure, and release-quality verification.

## Product Highlights

- Public landing, discovery, search, genre results, artist, track, playlist, and about pages.
- Persistent dark/orange player experience with queue controls, waveform progress, mobile drawer, repeat, shuffle, speed, volume, and recently played context.
- Real seeded WAV audio and generated artwork stored through MinIO-compatible object storage.
- Public playlist and search flows backed by live API data, including `/search?genre=ambient` and `/playlist/global-beats`.
- Creator flows for uploading, editing, publishing, and deleting tracks.
- Listener flows for likes, reposts, comments, follows, playlist creation, and add-to-playlist.
- Admin moderation hub for reports, hide/restore actions, user role management, and audit-oriented views.
- Professional public About page and documentation set for portfolio review.

## Technical Stack

- Web: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query, Zustand.
- API: NestJS 11, TypeORM, PostgreSQL 16, Redis 7, BullMQ, JWT / Passport.
- Shared package: workspace DTOs, enums, and typed contracts.
- Storage and mail: MinIO/S3-compatible object storage and Mailpit locally, with SMTP-ready production configuration.
- Delivery: Docker Compose, GitHub Actions, GHCR web/API packages, Playwright e2e, visual snapshots, and Docker smoke checks.

## Release Hardening

- Production environment validation blocks weak local secrets outside loopback/demo mode.
- Seed logging avoids exposing demo/admin passwords in production mode.
- Public playlist reads filter private, hidden, or draft entries to avoid accidental data exposure.
- Frontend API normalization supports direct arrays and envelope payloads for public data.
- README, Vietnamese README, GitHub About copy, local run guide, release checklist, and About page are aligned.
- `pnpm docs:check` guards README/docs/UI copy against common mojibake patterns.

## Verification Gate

This release is intended to pass:

```bash
pnpm docs:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm smoke:docker
```

Manual browser smoke targets:

- `/`
- `/discover`
- `/search?genre=ambient`
- `/track/aurora-current`
- `/playlist/global-beats`
- `/about`

## Packages

Published package/image targets:

- `ghcr.io/jasontm17/wavestream-api`
- `ghcr.io/jasontm17/wavestream-web`

## Known Demo Notes

- The repository Website field currently points to the README until a production deployment URL is available.
- Demo accounts and demo passwords are local-only and must not be used for a real production deployment.
- Mailpit is used for local email testing; production requires a real SMTP provider.
- MinIO is used locally as the S3-compatible object store; production should use a hardened object-storage provider or secured MinIO deployment.

## Repository About Copy

Description:

```text
Full-stack SoundCloud-inspired music platform built with Next.js 16, NestJS 11, PostgreSQL, Redis, MinIO, Docker, and GitHub Actions.
```

Website:

```text
https://github.com/JasonTM17/wavestream_soundcloud#readme
```

Topics:

```text
nextjs
nestjs
typescript
soundcloud-clone
music-streaming
postgresql
redis
minio
docker
github-actions
portfolio-project
full-stack
react
tailwindcss
typeorm
playwright
```
