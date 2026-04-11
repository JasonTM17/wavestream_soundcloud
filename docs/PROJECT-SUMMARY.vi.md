# WaveStream Project Summary

[English](./PROJECT-SUMMARY.md) | Tiếng Việt

## Tóm tắt một câu
WaveStream là nền tảng streaming âm nhạc mang tính portfolio, xây dựng theo mô hình pnpm monorepo với Next.js, NestJS, PostgreSQL, Redis, MinIO và Docker-first workflow.

## Giới thiệu ngắn
WaveStream mô phỏng một sản phẩm streaming hoàn chỉnh với trải nghiệm cho người nghe, công cụ cho creator và khu moderation cho admin trong cùng một local stack gần với production. Dự án được thiết kế như một case study portfolio để thể hiện tư duy full-stack, kiến trúc monorepo, xác thực an toàn, xử lý media và quy trình triển khai có thể chạy lại từ Docker.

## Resume Bullets
- Xây dựng trải nghiệm nghe nhạc gồm discovery, tìm kiếm, phát nhạc, playlist, follow, like, repost và bình luận.
- Thiết kế công cụ cho creator để upload, quản lý track và theo dõi analytics trên dashboard.
- Phát triển luồng moderation cho admin với hàng đợi report, xem trước target và thao tác có thể audit.
- Triển khai auth an toàn với access token, refresh-cookie rotation, reset mật khẩu và route được bảo vệ.
- Tổ chức hệ thống player và queue state ổn định để duy trì playback khi chuyển trang.

## LinkedIn Version
WaveStream là dự án portfolio về streaming âm nhạc, kết hợp Next.js, NestJS, PostgreSQL, Redis, MinIO và Docker thành một sản phẩm mô phỏng hoàn chỉnh. Dự án tập trung vào trải nghiệm người nghe, công cụ cho creator, moderation cho admin, xác thực an toàn và quy trình local setup gần với production.

## GitHub Description
Portfolio-grade music streaming platform built as a pnpm monorepo with Next.js, NestJS, PostgreSQL, Redis, MinIO, and Docker-first local orchestration.

## Stack Highlights
- `apps/web`: Next.js App Router cho public site, auth shell, app shell và player runtime state.
- `apps/api`: NestJS API cho auth, tracks, playlists, discovery, admin, analytics, storage và health checks.
- `packages/shared`: enums, DTO, pagination contracts và helper validation dùng chung.
- `docker-compose.yml` và `docker/`: orchestration local và Dockerfile theo hướng production.

## Impact Highlights
- Gói gọn toàn bộ hành trình từ discovery đến playback, playlist, creator tools và moderation trong một sản phẩm demo thống nhất.
- Cho phép khởi động local theo kiểu “one stack” với dữ liệu demo, migrations và services phụ trợ được nối sẵn.
- Tạo nền tảng trình diễn phù hợp cho CV, LinkedIn và GitHub vì vừa có chiều sâu kỹ thuật vừa có câu chuyện sản phẩm rõ ràng.

## Gợi ý sử dụng
- Dùng cho phần mô tả dự án ngắn trong CV hoặc resume.
- Dùng làm đoạn giới thiệu trên LinkedIn, portfolio site hoặc hồ sơ ứng tuyển.
- Dùng làm project blurb ngắn cho GitHub, email giới thiệu hoặc tài liệu phỏng vấn.

## Contact Note
WaveStream là một phần trong portfolio của Nguyễn Sơn. Nếu bạn muốn trao đổi cơ hội hợp tác, phản hồi dự án hoặc liên hệ nghề nghiệp, hãy gửi email tới `jasonbmt06@gmail.com`.
