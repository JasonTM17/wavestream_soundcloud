# WaveStream

[![CI](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/ci.yml/badge.svg)](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/ci.yml)
[![CD](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/cd.yml/badge.svg)](https://github.com/JasonTM17/Wavestream_Soundcloud/actions/workflows/cd.yml)

[English](./README.md) | Tiếng Việt

WaveStream là một nền tảng streaming nhạc cấp độ portfolio — bản clone full-stack của SoundCloud được xây dựng từ đầu dưới dạng pnpm monorepo. Dự án kết hợp frontend Next.js 16 App Router, API NestJS 11, PostgreSQL, Redis, MinIO và Mailpit thành một stack Docker-first cảm giác gần với sản phẩm production thực sự.

> **Dự án portfolio của [Nguyễn Sơn](mailto:jasonbmt06@gmail.com)** · [GitHub](https://github.com/JasonTM17/Wavestream_Soundcloud)

---

## Giới thiệu chuyên nghiệp

WaveStream được thiết kế để thể hiện tư duy xây dựng sản phẩm hoàn chỉnh, không chỉ là một demo tính năng. Dự án bao phủ các bề mặt chính của một nền tảng âm nhạc hiện đại: khám phá công khai, tìm kiếm, player liên tục, playlist, creator publishing, admin moderation theo role, báo cáo nội dung, khôi phục mật khẩu, object storage, background jobs và CI/CD.

**GitHub About đề xuất**

- Description: `Full-stack SoundCloud-inspired music platform built with Next.js 16, NestJS 11, PostgreSQL, Redis, MinIO, Docker, and GitHub Actions.`
- Topics: `nextjs`, `nestjs`, `typescript`, `soundcloud-clone`, `music-streaming`, `postgresql`, `redis`, `minio`, `docker`, `github-actions`, `portfolio-project`
- Website: URL deploy khi có, hoặc `/about` trong app đang chạy

Xem [docs/ABOUT.md](./docs/ABOUT.md) để đọc hồ sơ dự án đầy đủ và
[docs/GITHUB_ABOUT.md](./docs/GITHUB_ABOUT.md) để lấy nội dung copy-ready cho GitHub repository profile.

---

## Tính năng

| Khu vực      | Nội dung                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Listener** | Khám phá, tìm kiếm, phát nhạc liên tục, queue, playlist, like, repost, bình luận, theo dõi |
| **Creator**  | Upload & quản lý bài hát, dashboard analytics                                              |
| **Admin**    | Hàng đợi báo cáo, kiểm duyệt nội dung (ẩn/khôi phục), audit log, quản lý role người dùng   |
| **Auth**     | JWT access token, refresh-cookie rotation, đặt lại mật khẩu qua email, route được bảo vệ   |
| **Hạ tầng**  | Docker Compose full stack, GitHub Actions CI/CD, publish image lên GHCR                    |

---

## Cấu trúc Monorepo

```
.
├── apps/
│   ├── web/          # Next.js 16 — landing, auth, app shell, player
│   └── api/          # NestJS 11 — auth, tracks, playlists, discovery, admin
├── packages/
│   └── shared/       # DTOs, enums và validation contracts dùng chung
└── docker-compose.yml
```

---

## Stack Công nghệ

**Frontend** · Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query, Zustand

**Backend** · NestJS 11, TypeORM, PostgreSQL 16, Redis 7, BullMQ, Socket.IO, JWT/Passport

**Storage & Hạ tầng** · MinIO (S3-compatible), Docker, GitHub Actions, GHCR

---

## Khởi động nhanh

### Yêu cầu

- Node.js 20+, pnpm 10+, Docker

### Các bước

```bash
# 1. Clone và cài đặt
git clone https://github.com/JasonTM17/Wavestream_Soundcloud.git
cd Wavestream_Soundcloud
pnpm install

# 2. Cấu hình môi trường
cp .env.example .env
# Các giá trị mặc định hoạt động tốt với Docker local — không cần thay đổi

# 3. Khởi động toàn bộ stack
docker compose up --build
```

Các service sau khi khởi động:

| Service            | URL                              |
| ------------------ | -------------------------------- |
| Web app            | http://localhost:3000            |
| API health         | http://localhost:4000/api/health |
| API docs (Swagger) | http://localhost:4000/api/docs   |
| Mailpit inbox      | http://localhost:8025            |
| MinIO console      | http://localhost:9001            |

---

## Tài khoản Demo

| Role     | Email                    | Mật khẩu       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@wavestream.local` | `Admin123!`    |
| Creator  | `solis@wavestream.demo`  | `DemoPass123!` |
| Listener | `ivy@wavestream.demo`    | `DemoPass123!` |

---

## Phát triển

Chạy local không cần Docker:

```bash
pnpm dev          # Khởi động web (cổng 3000) + API (cổng 4000) ở chế độ watch
pnpm build        # Build production (cả hai app)
pnpm lint         # ESLint toàn bộ workspaces
pnpm typecheck    # Kiểm tra TypeScript strict
pnpm test         # Unit tests (Vitest + Jest)
pnpm test:e2e     # End-to-end tests (Playwright)
pnpm db:migrate   # Chạy TypeORM migrations
pnpm db:seed      # Seed dữ liệu demo
pnpm smoke:docker # Docker smoke test
```

---

## Tham chiếu Environment

| Nhóm     | Biến môi trường                                                                              |
| -------- | -------------------------------------------------------------------------------------------- |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`                                    |
| Redis    | `REDIS_HOST`, `REDIS_PORT`                                                                   |
| MinIO    | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`     |
| JWT      | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| SMTP     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`                                                        |
| App      | `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`                                    |

Xem `.env.example` để biết tất cả các giá trị kèm mô tả.
Đọc [docs/LOCAL_RUN.md](./docs/LOCAL_RUN.md) để nắm rõ Docker local, loopback host, Playwright và troubleshooting.
Trước khi deploy thật, dùng [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md) để kiểm tra secrets, storage, SMTP, backup, smoke test và rollback.
Nội dung release public đầu tiên nằm ở [docs/RELEASE_NOTES_v1.0.0.md](./docs/RELEASE_NOTES_v1.0.0.md).

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): install → lint → typecheck → unit test → build → Playwright E2E → Docker smoke
- **CD** (`.github/workflows/cd.yml`): publish Docker images lên GHCR khi merge vào `main`

Container images:

- `ghcr.io/jasontm17/wavestream-web`
- `ghcr.io/jasontm17/wavestream-api`

---

## Hướng dẫn Demo

1. Mở trang landing — duyệt discovery rails công khai không cần đăng nhập.
2. Đăng nhập với tài khoản **Creator** → player cố định, thư viện, creator dashboard.
3. Mở một bài hát → like, repost, bình luận, thêm vào playlist.
4. Vào trang playlist → sắp xếp lại bài hát, chỉnh sửa metadata (với tư cách chủ sở hữu).
5. Đăng nhập với tài khoản **Admin** → hàng đợi kiểm duyệt, xem xét báo cáo, quản lý role.
6. Mở Mailpit tại `http://localhost:8025` → kiểm tra luồng đặt lại mật khẩu end-to-end.

---

## Giấy phép

MIT — xây dựng cho mục đích học tập và portfolio. Mọi phản hồi và đóng góp đều được chào đón.
