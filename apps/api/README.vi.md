# WaveStream API

**Ngôn ngữ:** [English](./README.md) | Tiếng Việt

WaveStream API là backend NestJS cho demo streaming nhạc. Package này cung cấp các endpoint cho auth, tracks, playlists, discovery, notifications, analytics và moderation.

## Bắt đầu nhanh

```bash
pnpm install
pnpm start:dev
```

## Lệnh

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm migration:run
pnpm migration:revert
pnpm migration:show
pnpm seed
```

## Sơ Đồ Chính

- `src/main.ts` khởi tạo Nest runtime, global middleware, Swagger, CORS và validation.
- `src/modules/` chứa các domain module như auth, tracks, playlists, discovery, analytics, admin và notifications.
- `src/database/` giữ cấu hình TypeORM, entities, migrations và entrypoint cho seed.
- `test/` chứa integration tests của API và phần thiết lập end-to-end.

## Ghi chú

- Cần cấu hình môi trường và các service ở cấp repo trong `docker-compose.yml`.
- Khi server chạy, bạn có thể kiểm tra health và API docs từ service đang hoạt động.
- Không đưa secret vào mã nguồn; hãy dùng biến môi trường cho local và production.
