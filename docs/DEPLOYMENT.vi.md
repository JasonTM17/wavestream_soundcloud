# Hướng Dẫn Triển Khai WaveStream

[English](./DEPLOYMENT.md) | Tiếng Việt

Tài liệu này mô tả đường chạy local bằng Docker đã được kiểm tra và hình thái triển khai phù hợp nhất với stack hiện tại. Nội dung được giữ theo hướng thận trọng: không khẳng định những nền tảng chưa được xác minh trong repository này.

## Baseline Đã Kiểm Tra

Repository hiện được kiểm tra local bằng:

```bash
docker compose up --build
```

Stack đó khởi động các dịch vụ sau:

- PostgreSQL cho dữ liệu ứng dụng và migrations.
- Redis cho cache và rate limiting.
- MinIO cho lưu trữ audio và hình ảnh.
- Mailpit cho SMTP capture local.
- NestJS API.
- Next.js web app.

Với host production, dùng compose chạy từ image đã publish:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml --profile maintenance run --rm api-migrate
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Bắt đầu từ `.env.production.example`, giữ giá trị thật trong secret store riêng, và xem
[Production Operations](./PRODUCTION_OPERATIONS.md) để nắm branch protection, monitoring, log retention,
backup và rollback.

## Biến Môi Trường Bắt Buộc

Bắt đầu từ `.env.example` và điền giá trị thật cho môi trường production.

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_PUBLIC_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`
- `INTERNAL_API_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`, `ADMIN_USERNAME`

Khi đưa lên production, hãy thay toàn bộ secret mẫu bằng giá trị ngẫu nhiên đủ dài và không để chúng trong source control.

## Topology Khuyến Nghị

Cấu hình production đơn giản nhất là dùng một Docker host hoặc VM chạy cùng bộ dịch vụ như local compose stack:

- Web đặt sau một HTTPS origin có thể truy cập công khai.
- API đặt sau reverse proxy cùng lớp hoặc trên mạng nội bộ riêng.
- PostgreSQL, Redis và MinIO lưu dữ liệu bằng named volume hoặc storage gắn ngoài.
- Mailpit được thay bằng nhà cung cấp SMTP thật khi bắt đầu gửi mail production.

Nếu đặt app sau reverse proxy, hãy terminate TLS ở đó rồi forward traffic tới web và API qua internal network. Đồng bộ `FRONTEND_URL` và API origin với các URL công khai mà người dùng thực sự truy cập.

## Object Storage

WaveStream lưu audio track và artwork vào object storage tương thích S3. Trong stack hiện tại, vai trò này do MinIO đảm nhiệm.

- Đảm bảo bucket cho audio và hình ảnh đã sẵn sàng trước khi API khởi động.
- Public URL của object phải khớp với endpoint storage có thể truy cập bên ngoài.
- Sao lưu dữ liệu object song song với database nếu muốn có điểm khôi phục đầy đủ.

## Database Và Migrations

- Chạy thay đổi schema qua luồng migration của API trước khi public ứng dụng.
- Seed data hữu ích cho demo và preview nội bộ, nhưng production nên xem seeder là tùy chọn và idempotent.
- Sao lưu PostgreSQL định kỳ và test restore trước khi phụ thuộc vào môi trường đó.

## Mail Và Password Reset

Repository dùng Mailpit cho phát triển local. Khi lên production:

- Trỏ `SMTP_HOST` và `SMTP_PORT` tới một nhà cung cấp mail thật.
- Giữ `SMTP_FROM` khớp với domain bạn kiểm soát.
- Kiểm tra kỹ email reset mật khẩu và thông báo trước khi mở đăng ký công khai.

## Ghi Chú Vận Hành

- Tách riêng secret cho access token và refresh token.
- Đảm bảo cả origin của API và web đều có trong `FRONTEND_URL` khi CORS và cookie flow phải hoạt động giữa nhiều môi trường.
- Rà lại giới hạn upload, chính sách giữ dữ liệu object và giới hạn kích thước của reverse proxy trước khi mở creator uploads ra công khai.
- Theo dõi health endpoints sau khi deploy và gắn chúng vào container platform hoặc load balancer.
- Dùng branch `main` đã bật protection trên GitHub làm nguồn release; các required checks cần xanh trước khi promote Docker Hub hoặc GHCR images.
- Cập nhật website field của GitHub repository sang URL production thật sau khi có public web origin.

## Khôi Phục Và Bảo Trì

Đường reset local đã được kiểm tra là:

```bash
docker compose down -v --remove-orphans
```

Chỉ dùng lệnh này khi thật sự muốn xóa dữ liệu local. Ở production, hãy ưu tiên restart dịch vụ có mục tiêu, rolling updates và backup theo volume thay vì reset phá hủy.
