# WaveStream Case Study

English | [Tiếng Việt](./CASE-STUDY.vi.md)

WaveStream is a portfolio-grade audio platform built by Nguyễn Sơn to explore what it takes to ship a modern music product with real backend architecture, polished UX, and a developer workflow that feels close to production.

## Project Overview

The goal of WaveStream was not to ship another CRUD demo. The project started from a simple question: what would it look like to build an original, creator-focused audio platform that feels credible in a portfolio review?

The answer became a full-stack product with:

- public discovery for listeners
- creator uploads and owned-track management
- playlists, likes, follows, reposts, and comments
- role-aware auth and moderation flows
- a persistent audio player that survives route changes
- Docker-first local setup, seeded content, and GitHub Actions automation

## Product Vision

WaveStream is inspired by the product category of creator audio platforms, but it intentionally avoids copied branding, assets, and product copy. The vision was to design an original product that still captures the same sense of immediacy:

- listeners should be able to land on the site and hear music right away
- creators should be able to upload and manage tracks without dead-end UI
- admins should have enough moderation context to act safely
- the repo should feel like a serious engineering project, not a stitched-together showcase

## Who The Product Is For

WaveStream was designed around three user types:

- Listeners who want discovery, quick playback, playlists, follows, and social interaction.
- Creators who need track uploads, metadata management, playlists, and a dashboard view of activity.
- Admins who need report review, moderation actions, and audit-friendly context.

That role split shaped both the API design and the web routing model. Public browsing stays open, while creation and moderation actions are properly protected.

## Core Experience

From a product perspective, the most important flows are:

- landing on the site and starting playback immediately from seeded public tracks
- browsing discovery rails for tracks, artists, and playlists backed by real API data
- signing in and keeping session state stable through refresh-cookie bootstrap
- uploading tracks with audio and cover assets through a creator flow
- organizing playlists with add, remove, edit, and reorder actions
- reviewing reports in admin with meaningful target previews instead of raw IDs

The result is a project that can be demoed live without relying on fake buttons, empty screens, or hand-waved backend behavior.

## Technical Architecture

WaveStream is structured as a pnpm monorepo with clear application boundaries:

- `apps/web`: Next.js App Router frontend, auth shell, app shell, and persistent player runtime
- `apps/api`: NestJS backend with modular domains for auth, tracks, playlists, discovery, analytics, notifications, and admin
- `packages/shared`: DTOs, enums, and validation contracts used across web and API

The local stack runs through Docker Compose and includes:

- PostgreSQL for relational data
- Redis for supporting cache and queue-oriented runtime concerns
- MinIO for S3-compatible media storage
- Mailpit for local password-reset and email workflow testing

This structure made it possible to treat the app like a real system rather than a single-process demo.

## Key Engineering Decisions

Several implementation choices had an outsized impact on the quality of the product:

- Access tokens stay in memory, while refresh tokens rotate through `httpOnly` cookies for a more production-minded auth model.
- Audio playback is centralized in a global player runtime so queue state and progress survive navigation.
- Track streaming uses a web proxy path to support consistent playback behavior, including private owner access patterns that browser audio tags cannot handle with bearer headers alone.
- Discovery surfaces were tightened to remove fake metrics and only present data that can actually be clicked through into populated pages.
- Repo-facing docs, Docker flows, and GitHub Actions were treated as part of the product quality bar, not afterthoughts.

## Challenges Solved

The most valuable work in WaveStream was not just building features, but closing credibility gaps:

- turning placeholder discovery surfaces into real API-backed content
- fixing theme and contrast problems so the UI feels intentional in both light and dark mode
- making public and private playback reliable across route changes
- replacing empty-state “demo shell” language with product-facing copy
- ensuring artist, track, and playlist cards deep-link to real populated pages instead of fake endpoints
- getting CI and CD into a green, release-ready state with Docker smoke coverage and GHCR publishing

Those changes matter because portfolio reviewers usually notice polish gaps faster than feature counts.

## Quality, QA, And DevOps

WaveStream was built with the assumption that a convincing project has to survive verification:

- lint, typecheck, unit, integration, and browser tests are part of the workflow
- Playwright covers core cross-page behavior
- Docker Compose is used to verify the full local stack
- GitHub Actions validates CI on every main branch push
- GitHub Container Registry publishing is wired through CD for the web and API images

This turns the repo into something that is easier to review, easier to run, and easier to trust.

## Outcome

WaveStream now serves as a complete full-stack portfolio project that demonstrates:

- product thinking, not just framework familiarity
- experience across frontend, backend, auth, storage, testing, and DevOps
- the ability to iterate from rough scaffolding into a polished public-facing repository
- comfort with shipping systems that have multiple roles, multiple services, and real runtime constraints

## What I Learned

This project reinforced a few important engineering lessons:

- a believable demo depends on end-to-end integrity more than on raw feature count
- UI polish and interaction honesty are part of architecture quality
- auth, streaming, and Docker workflows introduce edge cases that only become obvious when the whole stack is exercised together
- public repos benefit a lot from strong docs, clean commit history, and a clear story about why the project exists

## Next Steps

If WaveStream were extended beyond the current portfolio scope, the highest-value next steps would be:

- cloud deployment with a public demo URL
- richer analytics and moderation insights
- deeper media processing such as waveform generation or transcoding
- stronger notification and social activity flows
- a short walkthrough video layered on top of the existing docs

## Contact

WaveStream is part of Nguyễn Sơn's portfolio and is built for learning, iteration, and thoughtful product exploration. Feedback and suggestions are welcome at `jasonbmt06@gmail.com`.
