# WaveStream Web

**Language:** English | [Tiếng Việt](./README.vi.md)

WaveStream Web is the Next.js frontend for the demo. It powers the landing page, auth flows, discovery, track pages, playlists, creator tools, and the persistent player shell.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm build
pnpm start
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Ownership Map

- `app/(marketing)` contains the public landing experience and non-auth product storytelling.
- `app/(auth)` owns sign-in, sign-up, forgot-password, and reset-password flows.
- `app/(app)` contains discovery, track, playlist, artist, library, creator, and admin routes.
- `components/` holds shared UI such as cards, dialogs, shell layout, and player-facing building blocks.
- `lib/` contains the API client, auth/session runtime, query helpers, and shared frontend utilities.
- `e2e/` and `vitest.*` cover browser and component-level regression checks.

## Notes

- The app expects the API and local services from the repo root to be available.
- `pnpm test:e2e` builds the app before running Playwright.
- The UI uses the shared design and data contracts from `@wavestream/shared`.
