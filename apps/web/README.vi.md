# WaveStream Web

**Ngôn ngữ:** [English](./README.md) | Tiếng Việt

WaveStream Web là frontend Next.js cho demo. Package này hiển thị landing page, auth, discovery, track detail, playlist, công cụ creator và shell player cố định.

## Bắt Đầu Nhanh

```bash
pnpm install
pnpm dev
```

## Lệnh

```bash
pnpm build
pnpm start
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Sơ Đồ Chính

- `app/(marketing)` chứa landing page công khai và phần giới thiệu sản phẩm.
- `app/(auth)` quản lý các luồng sign-in, sign-up, forgot-password và reset-password.
- `app/(app)` chứa các route discovery, track, playlist, artist, library, creator và admin.
- `components/` giữ UI dùng chung như cards, dialogs, shell layout và các khối của player.
- `lib/` chứa API client, runtime auth/session, query helpers và tiện ích frontend dùng chung.
- `e2e/` cùng các file `vitest.*` bao phủ kiểm thử trình duyệt và kiểm thử component.

## Ghi Chú

- Ứng dụng cần API và các service local từ repo gốc đang chạy.
- `pnpm test:e2e` sẽ build ứng dụng trước khi chạy Playwright.
- Giao diện dùng các contract dữ liệu và thiết kế dùng chung từ `@wavestream/shared`.
