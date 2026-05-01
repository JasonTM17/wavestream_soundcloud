# WaveStream UUID Compatibility Package

This private workspace package exists to bridge a TypeORM dependency gap.

TypeORM `0.3.28` currently depends on `uuid@^11.1.0`, while the security fix for `GHSA-w5hq-g745-h8pq` is available in `uuid@14.0.0`. The official `uuid@14` package is ESM-only, but TypeORM still loads UUID through CommonJS with `require("uuid")`.

WaveStream redirects only `typeorm > uuid` to this package through the root `pnpm.overrides` entry:

```json
{
  "pnpm": {
    "overrides": {
      "typeorm>uuid": "link:packages/uuid-compat"
    }
  }
}
```

## Scope

The package intentionally implements the UUID surface that WaveStream's TypeORM usage needs:

- `v4()`
- `parse()`
- `stringify()`
- `validate()`
- `version()`
- `NIL`, `nil`, and `MAX`

Unsupported generators such as `v1`, `v3`, `v5`, `v6`, and `v7` throw explicit errors. This keeps the compatibility layer narrow instead of pretending to be the full upstream UUID library.

## Security Behavior

Caller-provided output buffers are range-checked before bytes are written. Out-of-range writes throw `RangeError`, which is the patched behavior required by `GHSA-w5hq-g745-h8pq`.

## Verification

Run:

```bash
pnpm --filter uuid test
pnpm run audit
pnpm test
```

The package should be removed when TypeORM supports `uuid >= 14` without a CommonJS compatibility issue.
