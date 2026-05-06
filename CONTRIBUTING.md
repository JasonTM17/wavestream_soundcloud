# Contributing to WaveStream

WaveStream is a portfolio project, so contributions should keep the repository polished, easy to review, and safe to run locally.

## Local Setup

```bash
pnpm install
cp .env.example .env
docker compose up --build
```

The main app runs at `http://localhost:3000`, and the API runs at `http://localhost:4000/api`.

## Development Checks

Run the smallest check that covers your change before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
```

Use `pnpm test:e2e` and `pnpm smoke:docker` for changes that affect user flows, Docker, or deployment behavior.

## Commit Style

Write commit messages in English and prefer conventional prefixes:

- `feat(scope): add user-facing capability`
- `fix(scope): correct broken behavior`
- `docs(scope): update documentation`
- `test(scope): cover behavior`
- `refactor(scope): improve structure without behavior changes`
- `ci(scope): update workflows`
- `chore(scope): maintain tooling or metadata`

Keep each commit focused. Avoid committing generated caches, logs, secrets, or local environment files.

## Pull Request Checklist

- The change is scoped and easy to review.
- Relevant tests or checks have been run.
- Documentation is updated when behavior or setup changes.
- Screenshots are included for meaningful UI changes.
- New environment variables are documented in `.env.example`.
