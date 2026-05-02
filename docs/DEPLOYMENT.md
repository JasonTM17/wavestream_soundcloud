# WaveStream Deployment Guide

English | [Tiếng Việt](./DEPLOYMENT.vi.md)

This guide documents the tested local Docker-first path and the deployment shape that best matches the current stack. It is intentionally conservative: it avoids platform-specific claims that have not been verified in this repository.

## Tested Baseline

The repository is validated locally with:

```bash
docker compose up --build
```

That stack starts:

- PostgreSQL for application data and migrations.
- Redis for caching and rate limiting.
- MinIO for audio and image storage.
- Mailpit for local SMTP capture.
- NestJS API.
- Next.js web app.

For production hosts, use the image-based compose file:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml --profile maintenance run --rm api-migrate
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Start from `.env.production.example`, keep real values in a private secret store, and see
[Production Operations](./PRODUCTION_OPERATIONS.md) for branch protection, monitoring, log retention,
backup, and rollback details.

## Required Environment

Start from `.env.example` and supply real values for production.

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_PUBLIC_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`
- `INTERNAL_API_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`, `ADMIN_USERNAME`

For production, replace the example secrets with long random values and keep them out of source control.

## Recommended Topology

The simplest production-minded setup is a single Docker host or VM running the same services as the local compose stack:

- Web on an externally reachable HTTPS origin.
- API behind the same reverse proxy or on a private internal network.
- PostgreSQL, Redis, and MinIO persisted on named volumes or attached storage.
- Mailpit replaced by a real SMTP provider when you are sending production mail.

If you place the app behind a reverse proxy, terminate TLS there and forward traffic to the web and API services over the internal network. Keep the `FRONTEND_URL` and API origin values aligned with the public URLs users actually visit.

## Object Storage

WaveStream stores track audio and artwork in S3-compatible object storage. In the current stack that role is handled by MinIO.

- Keep the audio and image buckets available before the API starts.
- Ensure the public URL for objects matches the externally reachable storage endpoint.
- Back up object data alongside the database if you want a complete restore point.

## Database And Migrations

- Run schema changes through the API migration flow before exposing the application.
- Seed data is useful for demos and internal previews, but production deployments should treat seeders as optional and idempotent.
- Back up PostgreSQL regularly and test restores before relying on the environment.

## Mail And Password Reset

The repository uses Mailpit for local development. For production:

- Point `SMTP_HOST` and `SMTP_PORT` at a real mail provider.
- Keep `SMTP_FROM` aligned with the domain you control.
- Verify password-reset and notification emails before enabling public sign-up.

## Operational Notes

- Keep access and refresh token secrets separate.
- Make sure the API and web origins are both included in `FRONTEND_URL` when CORS and cookie flows need to work across environments.
- Review upload limits, object retention policies, and reverse proxy size caps before exposing creator uploads publicly.
- Monitor the health endpoints after deployment and wire them into your container platform or load balancer.
- Use the GitHub protected `main` branch as the release source; required checks should stay green before promoting Docker Hub or GHCR images.
- Update the GitHub repository website field to the real deployed web URL once a public production origin exists.

## Recovery And Maintenance

The tested local reset path is:

```bash
docker compose down -v --remove-orphans
```

Use that only when you want to remove local data. In production, prefer targeted service restarts, rolling updates, and volume-aware backups over destructive resets.
