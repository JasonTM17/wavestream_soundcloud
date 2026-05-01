# WaveStream Production Operations

This runbook covers the production-ready path after CI/CD is green and GHCR images are published.

## Repository Guardrails

The `main` branch is protected on GitHub.

- Required checks: `Lint, Typecheck & Unit Tests`, `Build`, `E2E Tests`, `Docker Smoke Test`.
- Pull requests require at least one approving review.
- Stale approvals are dismissed after new commits.
- Conversations must be resolved before merge.
- Force pushes and branch deletion are disabled.

These settings keep `main` aligned with the same quality gate that validates the portfolio release.

## Production URL Checklist

Set these URLs before calling an environment production-ready:

| Purpose      | Example                           | Environment                                 |
| ------------ | --------------------------------- | ------------------------------------------- |
| Web app      | `https://music.example.com`       | `FRONTEND_URL`                              |
| Public API   | `https://api.music.example.com`   | `NEXT_PUBLIC_API_URL`                       |
| Public media | `https://media.music.example.com` | `MINIO_PUBLIC_URL`, `NEXT_PUBLIC_MINIO_URL` |

After a real deployed URL exists, update the GitHub repository website field from the README link to the deployed web origin.

## Docker Production Stack

Use `docker-compose.prod.yml` when deploying from published GHCR images instead of rebuilding from source on the server.

1. Create a private env file from `.env.production.example`.
2. Fill every secret with production values.
3. Pull the release images:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
```

4. Run migrations:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile maintenance run --rm api-migrate
```

5. Start the app:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

6. Verify health:

```bash
curl -f http://127.0.0.1:4000/api/health
curl -f http://127.0.0.1:3000
```

The production compose file binds web, API, and MinIO to `127.0.0.1` by default so a reverse proxy can terminate TLS and expose only the intended public origins.

## Reverse Proxy

Terminate HTTPS at a reverse proxy such as Nginx, Caddy, Traefik, or the hosting platform edge.

- Route the web origin to `127.0.0.1:3000`.
- Route the API origin to `127.0.0.1:4000`.
- Route the media origin to `127.0.0.1:9000`.
- Keep upload body-size limits aligned with the creator upload limits.
- Forward `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For`.

## Monitoring

Minimum production monitors:

- API health: `GET /api/health`.
- Web root: `GET /`.
- Public route smoke: `/discover`, `/search?genre=ambient`, `/playlist/global-beats`, `/track/aurora-current`, `/about`.
- Media smoke: play a public track and verify the stream route returns audio bytes.
- SMTP smoke: request a password reset and confirm delivery.
- Storage smoke: verify public audio and artwork URLs resolve from the media origin.

Operational signals to watch:

- API 5xx rate and latency.
- Web server 5xx rate.
- Failed media proxy requests.
- PostgreSQL disk usage and connection count.
- Redis memory and eviction count.
- MinIO disk usage and read errors.
- Password reset delivery failures.

## Logs

`docker-compose.prod.yml` caps local Docker json-file logs with:

```text
LOG_MAX_SIZE=10m
LOG_MAX_FILE=5
```

For production, ship container logs to the host platform or a log service. Keep at least enough retention to debug the last release, password reset failures, upload failures, and moderation actions.

## Backups

Back up these stores before every release:

- PostgreSQL volume `wavestream-production-postgres-data`.
- MinIO volume `wavestream-production-minio-data`.
- The private production env/secret store.

Test restore in a non-production environment before relying on backups. A complete restore requires both database rows and object storage files because tracks and artwork live outside PostgreSQL.

## Rollback

1. Keep the previous `WAVESTREAM_IMAGE_TAG` available in GHCR.
2. If no irreversible migration ran, switch the image tag back and restart web/API.
3. If data changed incompatibly, stop writes and restore PostgreSQL plus MinIO from the matching backup pair.
4. Run health checks and manual browser smoke before reopening traffic.
