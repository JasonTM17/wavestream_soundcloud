# About WaveStream

WaveStream is a production-minded music streaming portfolio project. It is inspired by modern creator/listener audio platforms, but it uses its own dark/orange visual direction, its own seed catalog, and its own full-stack implementation.

## Product Positioning

WaveStream is designed to feel like a real product, not just a static clone. The app includes public discovery, genre search, track pages, playlist pages, persistent playback, queue controls, creator uploads, reporting, admin moderation, password reset, object storage, background jobs, Docker infrastructure, and CI/CD quality gates.

The seeded catalog includes generated WAV audio and artwork stored through MinIO, so playback, streaming, playlists, and search use real media files during local demos.

## Core User Flows

### Listener

- Browse discovery rails with real public tracks, playlists, and artists.
- Search tracks, artists, playlists, and genres.
- Open genre landing through `/search?genre=ambient`.
- Play tracks from landing, discovery, search, playlist, and track pages.
- Use queue, next, repeat, shuffle, volume, speed, and mobile mini-player controls.
- Like, repost, comment, follow, and manage personal playlists.

### Creator

- Upload audio and artwork.
- Edit track metadata, genre, tags, privacy, and publishing state.
- View creator dashboard surfaces.
- Manage owned playlists.
- Delete or update content through protected routes.

### Admin

- Review reported tracks, comments, playlists, or users.
- Hide and restore moderated content.
- Manage user roles.
- Review audit log and moderation history.
- Use role-gated admin routes protected by API and frontend checks.

## Technical Architecture

| Area             | Implementation                                                        |
| ---------------- | --------------------------------------------------------------------- |
| Web              | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI |
| API              | NestJS 11, TypeORM, PostgreSQL, Redis, BullMQ, JWT / Passport         |
| Shared contracts | Workspace package with DTOs, enums, and typed contracts               |
| Storage          | MinIO/S3-compatible object storage for audio and artwork              |
| Mail             | Mailpit locally, SMTP provider in production                          |
| Delivery         | Docker Compose, GitHub Actions, GHCR image publishing                 |
| Tests            | Vitest, Jest, Playwright e2e, visual snapshots, Docker smoke          |

## Quality Signals

- Dark/orange theme is the default public experience.
- Public pages have friendly empty and error states.
- Search, playlist, artist, and track payloads normalize API response envelopes defensively.
- Public playlist reads filter private, hidden, or draft legacy entries.
- Production env validation blocks weak local secrets.
- Seed logging avoids printing demo passwords in production.
- Release docs cover secrets, storage, SMTP, database backup, smoke testing, and rollback.

## Documentation Map

- [README.md](../README.md): main English setup, features, scripts, and demo flow.
- [README.vi.md](../README.vi.md): Vietnamese setup and project overview.
- [docs/LOCAL_RUN.md](./LOCAL_RUN.md): local Docker/dev guidance and troubleshooting.
- [docs/RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md): production release checklist.
- [docs/GITHUB_ABOUT.md](./GITHUB_ABOUT.md): copy-ready GitHub repository profile.

## Vietnamese Summary

WaveStream là dự án portfolio full-stack mô phỏng một nền tảng streaming nhạc hoàn chỉnh: discovery công khai, tìm kiếm theo thể loại, player liên tục, playlist, upload nhạc, báo cáo nội dung, kiểm duyệt admin, xác thực, object storage, Docker và CI/CD. Mục tiêu của dự án là thể hiện năng lực xây dựng sản phẩm thật từ frontend, backend, dữ liệu, hạ tầng đến kiểm thử release.
