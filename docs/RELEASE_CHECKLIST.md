# WaveStream Release Checklist

Use this checklist before treating a WaveStream deployment as production-ready. It is written for the current Docker-first monorepo with `apps/web`, `apps/api`, PostgreSQL, Redis, MinIO-compatible storage, SMTP, and GitHub Actions.

## 1. Release Scope

- Confirm the release version, commit SHA, and image tags for web and API.
- Confirm the target environment: staging or production.
- Confirm no local-only configuration is being promoted.
- Review the migration list and any data repair scripts before deployment.
- Record the expected public routes for smoke testing:
  - `/`
  - `/discover`
  - `/search?genre=ambient`
  - `/track/aurora-current`
  - `/playlist/global-beats`
  - `/about`

## 2. Required Environment

Set these values explicitly in production:

```text
NODE_ENV=production
FRONTEND_URL=https://your-web-origin.example
NEXT_PUBLIC_API_URL=https://your-api-origin.example
INTERNAL_API_URL=http://private-api-origin-or-service-name:4000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
MINIO_PUBLIC_URL=https://your-public-media-origin.example
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Production rules:

- `ALLOW_WEAK_LOCAL_SECRETS` must be unset or `false`.
- Local demo secrets such as `change-me-*`, `Admin123!`, and `wavestream_secret` must not be used.
- `FRONTEND_URL` must contain only trusted deployed web origins.
- `NEXT_PUBLIC_API_URL` must be reachable from the browser.
- `INTERNAL_API_URL` must be reachable from the server runtime used by the web app.

## 3. Secret Hardening

- Generate unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values with at least 32 characters.
- Rotate secrets after demos, screen recordings, accidental logs, or shared `.env` files.
- Use a strong `ADMIN_PASSWORD`; never keep the local demo password in production.
- Store database, Redis, SMTP, and object-storage credentials in the platform secret manager.
- Do not print demo passwords from seed scripts when `NODE_ENV=production`.

## 4. Database

- Take a database backup before the release.
- Verify the backup can be restored in a non-production environment.
- Run migrations before starting the new API version.
- Confirm rollback impact if a migration is not reversible.
- After deployment, check core tables for seeded/public data used by smoke tests:
  - users
  - tracks
  - playlists
  - playlist tracks
  - reports

## 5. Storage

- Confirm the object-storage bucket exists.
- Confirm audio files and artwork are readable by the web app through the configured public URL.
- Confirm private or draft tracks are not exposed through playlist, artist, discovery, search, or direct public pages.
- Confirm upload size limits match the deployment proxy and API settings.
- Confirm CORS on the storage origin allows the deployed web origin when direct asset reads are needed.

## 6. Mail

- Replace Mailpit with a real SMTP provider.
- Verify `SMTP_FROM` is a verified sender.
- Trigger a password reset from the deployed app.
- Confirm the reset email arrives.
- Confirm the reset link uses the production frontend origin.
- Confirm expired or reused reset tokens are rejected.

## 7. Build And Test Gate

Run the full local quality gate before publishing images:

```bash
pnpm docs:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm smoke:docker
```

Expected result:

- Docs check finds no mojibake in README, docs, UI copy, i18n, or e2e text.
- Unit tests pass for web and API.
- Production build passes for web, API, and shared package.
- Playwright e2e passes against the production-style standalone web build.
- Docker smoke passes public pages and media proxy checks.

## 8. Deployment Steps

1. Confirm `main` branch protection is enabled and the required checks are green.
2. Build or pull the web and API images for the release SHA.
3. Apply environment variables and secrets from `.env.production.example` or your platform secret manager.
4. Run database migrations with `docker-compose.prod.yml` or the platform migration job.
5. Start or roll the API service.
6. Start or roll the web service.
7. Confirm API health at `/api/health`.
8. Confirm web root returns `200`.
9. Run smoke checks before opening traffic widely.
10. If a public web URL exists, update the GitHub repository website field to that deployed origin.

## 9. Manual Browser Smoke

Open the deployed web app in a fresh browser session and verify:

- The app defaults to the dark/orange theme.
- `/discover` shows real seeded tracks, playlists, and artists.
- `/search?genre=ambient` shows `Blue Hour Tide` or another Ambient track and the top-result play button is enabled.
- `/playlist/global-beats` renders the hero, owner, track list, and play button.
- `/track/aurora-current` renders the track hero, waveform, actions, comments, artist sidebar, and related tracks.
- `/about` renders professional public-facing copy in the selected locale.
- No public page gets stuck on skeleton loading.
- No route shows an unintended white panel in dark mode.
- Browser console has no application errors.

## 10. Rollback

- Keep the previous web and API image tags available.
- Record the migration version included in the release.
- If rollback needs a database restore, stop writes before restoring.
- Prefer rolling back app images first when the database schema remains compatible.
- After rollback, run API health, web root, public playlist, public track, and media proxy smoke checks.

## 11. Post-release Monitoring

- Watch API error rate, response latency, and memory usage.
- Watch web server errors and failed media proxy requests.
- Check Redis queue health.
- Check storage read failures.
- Confirm password reset email delivery.
- Review admin report and audit-log pages after the first production moderation action.

Use [Production Operations](./PRODUCTION_OPERATIONS.md) for the deploy command sequence, reverse proxy
shape, Docker log retention, backup scope, and rollback flow.
