# WaveStream Local Run Guide

This guide explains how to run WaveStream locally without tripping over loopback host, CORS, cookie, storage, or Playwright differences.

## Recommended Local URLs

| Surface       | Preferred URL                      |
| ------------- | ---------------------------------- |
| Web           | `http://localhost:3000`            |
| API           | `http://localhost:4000`            |
| API health    | `http://localhost:4000/api/health` |
| Swagger       | `http://localhost:4000/api/docs`   |
| Mailpit       | `http://localhost:8025`            |
| MinIO Console | `http://localhost:9001`            |

## Loopback Host Rule

Use one hostname family consistently during manual browser testing.

Good pairs:

- `http://localhost:3000` with `http://localhost:4000`
- `http://127.0.0.1:3000` with `http://127.0.0.1:4000`

Avoid mixing `localhost` on one side and `127.0.0.1` on the other when diagnosing browser behavior. Matching hosts keeps cookies, CORS, refresh auth, and localStorage easier to reason about.

WaveStream has defensive loopback handling for local smoke tests. The API can allow loopback CORS automatically when configured origins are local, but matching hosts is still the cleanest path.

## Docker-first Flow

Use Docker when you want the app to behave closest to the production stack.

```bash
pnpm install
cp .env.example .env
docker compose up --build
```

After startup:

- Open web at `http://localhost:3000`.
- Check API health at `http://localhost:4000/api/health`.
- Open Swagger at `http://localhost:4000/api/docs`.
- Open Mailpit at `http://localhost:8025`.
- Open MinIO Console at `http://localhost:9001`.

## Demo Accounts

| Role     | Email                    | Password       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@wavestream.local` | `Admin123!`    |
| Creator  | `solis@wavestream.demo`  | `DemoPass123!` |
| Listener | `ivy@wavestream.demo`    | `DemoPass123!` |

These credentials are for local development only. Production must use strong secrets and must not print demo passwords from seed scripts.

## Local Dev Without Docker

Use this flow when actively editing code:

```bash
pnpm install
pnpm dev
```

Default local ports:

- Web: `3000`
- API: `4000`

Useful targeted commands:

```bash
pnpm dev:web
pnpm dev:api
pnpm --filter web test
pnpm --filter api test
pnpm --filter web typecheck
pnpm --filter api typecheck
```

If you override ports, align these variables:

```text
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
INTERNAL_API_URL=http://localhost:4000
```

## Production-style Local Smoke

Use this when a bug appears only after `next build`.

```bash
pnpm --filter web build
pnpm --filter web exec node ./scripts/prepare-playwright-server.mjs
```

Then start the standalone server with matching API values if you need to inspect the production artifact manually.

The normal e2e command already does this automatically:

```bash
pnpm test:e2e
```

## Verification Matrix

Before saying a local change is done, prefer this order:

```bash
pnpm docs:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm smoke:docker
```

For a narrower frontend-only pass:

```bash
pnpm --filter web test
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter web test:e2e
```

## Manual Smoke Routes

After Docker or production-style startup, verify:

- `/`
- `/discover`
- `/search?genre=ambient`
- `/track/aurora-current`
- `/playlist/global-beats`
- `/about`

Expected public behavior:

- Dark/orange theme by default in a fresh browser session.
- Real seeded tracks appear on discovery, search, playlist, and track pages.
- The player can start from landing, search, playlist, and track surfaces.
- Public pages show friendly error or empty states instead of blank skeletons.
- Vietnamese locale text renders with correct accents.

## Troubleshooting

### Search page shows an error for empty results

Check the API request in devtools or server logs. `/api/search` should receive a `q` parameter. It should not reject extra unsupported query parameters.

### Public page stays on skeleton

Check `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, and API health. Also verify the browser and API are using the same loopback host family.

### Audio does not play

Check that MinIO is running, seeded objects exist, and the API media proxy can read the private object. Then run:

```bash
pnpm smoke:docker
```

### Login or refresh behaves differently between tabs

Clear cookies and localStorage for both `localhost` and `127.0.0.1`, then retest with a single hostname family.

### Vietnamese text looks broken

Run:

```bash
pnpm docs:check
```

The check scans README, docs, UI copy, i18n files, and e2e text for common mojibake patterns.
