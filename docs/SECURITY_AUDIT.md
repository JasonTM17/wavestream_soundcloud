# WaveStream Security Audit Policy

WaveStream treats dependency audit as a release gate. CI runs:

```bash
pnpm run audit
```

The script executes `pnpm audit --audit-level moderate --json` through `scripts/audit-security.mjs` and fails on every moderate-or-higher advisory. There are no ignored advisories in the current release.

## TypeORM UUID Compatibility Patch

The latest TypeORM package currently declares `uuid: ^11.1.0`, while the published `uuid` fix for `GHSA-w5hq-g745-h8pq` starts at `14.0.0`.

Using the official `uuid@14` package as a direct override is not compatible with TypeORM's current CommonJS load path: TypeORM calls `require("uuid")`, while `uuid@14` is ESM-only. That combination breaks Jest and CommonJS runtime loading.

WaveStream resolves the advisory without accepting an audit exception by redirecting only `typeorm > uuid` to `packages/uuid-compat` through `pnpm.overrides`.

The compatibility package is intentionally narrow:

- It is named `uuid` and versioned `14.0.0` so audit sees a patched UUID dependency.
- It provides CommonJS and ESM entrypoints.
- It implements the UUID functions TypeORM needs in this project, especially `v4()`.
- It validates caller-provided buffer ranges before writing bytes, matching the security behavior required by the advisory.
- It is covered by `packages/uuid-compat/index.test.mjs`.

Application identifiers still come from PostgreSQL `uuid_generate_v4()` through TypeORM entities and migrations. WaveStream application code does not call `uuid` directly.

## Risk Boundary

This is not a general-purpose UUID library replacement for application code. It is a private compatibility layer for TypeORM's current CommonJS dependency path.

The boundary is intentionally enforced by project convention:

- Keep application UUID generation in PostgreSQL and TypeORM entity metadata.
- Do not import `uuid` directly from application source.
- If application code needs UUID helpers in the future, use the official upstream `uuid` package directly after the TypeORM compatibility path is removed or isolated.

## Current Verification

The current release has:

- No ignored audit advisories.
- `pnpm run audit` passing with no moderate-or-higher advisories.
- `pnpm --filter uuid test` covering CommonJS import, ESM import, UUID validation, parse/stringify round-trip, valid buffer writes, and out-of-range buffer rejection.
- Docker API builds copying `packages/uuid-compat` into the image so TypeORM can resolve the override during migrations and runtime.

## Maintenance Policy

Revisit this patch when any of the following changes:

- TypeORM releases a version that supports `uuid >= 14` or removes the CommonJS-only UUID loading path.
- WaveStream starts using UUID APIs directly in application code.
- A new advisory affects the compatibility package behavior.
- The project migrates away from TypeORM.

When upstream compatibility exists, remove `packages/uuid-compat`, remove the `typeorm>uuid` override, reinstall dependencies, and run the full gate:

```bash
pnpm run audit
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm smoke:docker
```
