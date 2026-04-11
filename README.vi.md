# WaveStream

[![CI](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/ci.yml/badge.svg)](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/ci.yml)
[![CD](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/cd.yml/badge.svg)](https://github.com/JasonTM17/wavestream_soundcloud/actions/workflows/cd.yml)

[English](./README.md) | Tiếng Việt

WaveStream là một nền tảng streaming âm nhạc mang tính portfolio, được xây dựng dưới dạng pnpm monorepo. Dự án kết hợp frontend Next.js App Router, API NestJS, PostgreSQL, Redis, MinIO và Mailpit thành một local stack chạy bằng Docker, đủ gần với một sản phẩm thật thay vì chỉ là starter template.

## Ghi Chú Portfolio

Dự án này thuộc portfolio của Nguyễn Sơn. Nếu bạn muốn góp ý, trao đổi ý tưởng hợp tác hoặc liên hệ về portfolio, vui lòng gửi email tới `jasonbmt06@gmail.com`.

WaveStream được xây dựng cho mục đích học tập và portfolio. Mọi góp ý, đề xuất và đóng góp xây dựng đều rất được hoan nghênh.

## Bao Gồm Những Gì

- Trải nghiệm cho người nghe với discovery, tìm kiếm, phát nhạc, playlist, follow, like, repost và bình luận.
- Công cụ cho creator để upload, quản lý track của mình và xem analytics trên dashboard.
- Moderation cho admin với hàng đợi report, xem trước target và các thao tác có log rõ ràng.
- Xác thực an toàn với access token, refresh-cookie rotation, reset mật khẩu và route được bảo vệ.
- Audio player cố định, queue state và hành vi phát nhạc ổn định khi chuyển route.

## Kiến Trúc Monorepo

- `apps/web`: frontend Next.js cho trang public, auth shell, app shell và state của player/runtime.
- `apps/api`: API NestJS cho auth, tracks, playlists, discovery, admin, analytics, storage và health check.
- `packages/shared`: enums, DTO, contract phân trang và helper validation dùng chung giữa các app.
- `docker-compose.yml`: file orchestration local cho toàn bộ stack.
- `docker/`: Dockerfile theo hướng production cho web và API.

## Khởi Chạy Local

1. Copy `.env.example` sang `.env` và giữ các giá trị mặc định local, trừ khi máy bạn đã dùng trùng một port nào đó.
2. Chạy `pnpm install`.
3. Khởi động toàn bộ stack bằng `docker compose up --build`.
4. Mở các dịch vụ chính:
   - Web: `http://localhost:3000`
   - API health: `http://localhost:4000/api/health`
   - Mailpit inbox: `http://localhost:8025`
   - MinIO console: `http://localhost:9001`
   - PostgreSQL host port: mặc định là `localhost:5433`

Compose stack sẽ tự khởi động PostgreSQL, Redis, MinIO, Mailpit, migrations của API, seed data của API, dịch vụ API và web app theo đúng thứ tự.

## Tài Khoản Seed Sẵn

- Admin: `admin@wavestream.local` / `Admin123!`
- Creator: `solis@wavestream.demo` / `DemoPass123!`
- Listener: `ivy@wavestream.demo` / `DemoPass123!`

## Các Lệnh Hữu Ích

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
pnpm smoke:docker
```

## Quy Trình Docker

- `docker compose up --build` khởi động toàn bộ môi trường local từ đầu.
- `docker compose down -v --remove-orphans` dừng toàn bộ stack và xóa volumes nếu bạn muốn reset sạch.
- Container API sẽ chạy migrations và seed data qua chuỗi dependency của compose, nên một stack mới lên sẽ có sẵn dữ liệu demo.

## Môi Trường

Template môi trường chuẩn là `.env.example`. Các nhóm biến chính gồm:

- `DB_*` cho kết nối và thông tin đăng nhập PostgreSQL.
- `REDIS_*` cho rate limiting và cache.
- `MINIO_*` cho object storage và URL media sinh ra.
- `JWT_*` cho việc ký access token và refresh token.
- `SMTP_*` cho Mailpit hoặc nhà cung cấp mail thật.
- `ADMIN_*` cho tài khoản admin seed sẵn.
- `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, và `INTERNAL_API_URL` cho routing web/API.

## CI/CD

- CI xác thực chuỗi install, lint, typecheck, test, build, Playwright end-to-end và Docker smoke trong `.github/workflows/ci.yml`.
- CD publish container images lên GitHub Container Registry từ `.github/workflows/cd.yml`.
- Tên image chuẩn:
  - `ghcr.io/jasontm17/wavestream-web`
  - `ghcr.io/jasontm17/wavestream-api`

## Luồng Demo Đề Xuất

1. Mở landing page và chỉ ra các rail discovery công khai.
2. Đăng nhập bằng tài khoản creator và demo persistent player, library cùng creator dashboard.
3. Mở trang track, minh họa các thao tác like, repost, comment và add-to-playlist.
4. Vào trang playlist và cho thấy quyền add, reorder, edit và delete của owner.
5. Đăng nhập bằng tài khoản admin và mở moderation queue để xem target previews.
6. Mở Mailpit để chứng minh luồng reset mật khẩu chạy end-to-end.

## Tài Liệu Thêm

- [Deployment guide](./docs/DEPLOYMENT.md)
- [Hướng dẫn triển khai - Tiếng Việt](./docs/DEPLOYMENT.vi.md)
- [Demo walkthrough](./docs/DEMO-WALKTHROUGH.md)
- [Demo walkthrough - Tiếng Việt](./docs/DEMO-WALKTHROUGH.vi.md)
