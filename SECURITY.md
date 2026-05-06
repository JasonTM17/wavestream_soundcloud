# Security Policy

## Supported Version

WaveStream is maintained from the `main` branch. Security fixes are applied there first.

## Reporting a Vulnerability

Please do not open a public issue for suspected vulnerabilities.

Report security concerns privately by emailing `jasonbmt06@gmail.com` with:

- a clear description of the issue,
- reproduction steps or proof-of-concept details,
- affected routes, services, or dependencies,
- any suggested mitigation, if available.

I will review credible reports as soon as possible and prioritize fixes based on impact.

## Security Practices

- Secrets are stored in environment variables and are not committed.
- CI runs linting, type checks, tests, documentation encoding checks, builds, E2E tests, Docker smoke tests, and dependency auditing.
- Docker images are published through GitHub Actions with scoped package permissions.
