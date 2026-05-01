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
