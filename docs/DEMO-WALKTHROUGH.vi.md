# Hướng Dẫn Demo WaveStream

[English](./DEMO-WALKTHROUGH.md) | Tiếng Việt

Đây là kịch bản demo ngắn gọn trong khoảng 5 đến 10 phút mà bạn có thể dùng cho portfolio walkthrough.

## Trước Khi Bắt Đầu

- Mở ứng dụng tại `http://localhost:3000`.
- Giữ Mailpit mở tại `http://localhost:8025`.
- Chuẩn bị sẵn các tài khoản seed:
  - Admin: `admin@wavestream.local` / `Admin123!`
  - Creator: `solis@wavestream.demo` / `DemoPass123!`
  - Listener: `ivy@wavestream.demo` / `DemoPass123!`

## Luồng Demo

1. Bắt đầu từ landing page và giới thiệu các rail discovery công khai, featured artists và playlist.
2. Đăng nhập bằng tài khoản creator và cho thấy session được giữ trong app shell cùng sticky player và điều hướng dành cho creator.
3. Mở một trang track, phát audio và chỉ ra queue, progress bar, các thao tác like, repost, comment và add-to-playlist.
4. Vào trang library để giới thiệu phần tóm tắt creator dashboard, listening history và owned playlists.
5. Mở một playlist và demo các thao tác edit, reorder, remove-track và delete dành cho owner.
6. Chuyển sang tài khoản listener và cho thấy public browsing vẫn hoạt động trong khi các khu vực chỉ dành cho creator vẫn được bảo vệ.
7. Đăng nhập bằng tài khoản admin và mở moderation queue để xem report previews, target labels và deep links.
8. Mở Mailpit và trình bày luồng email reset mật khẩu chạy end to end.

## Các Điểm Nên Nhấn Mạnh

- Sản phẩm được xây dựng như một monorepo thật, không phải mock frontend.
- Audio playback an toàn khi chuyển route và được giữ bởi persistent player state.
- Auth dùng refresh-cookie bootstrap để UI cho cảm giác như một app session thực tế.
- Media upload, playlist và moderation actions đều đi qua backend flow thật.

## Câu Kết Gợi Ý

Nếu bạn muốn một câu kết ngắn gọn, có thể dùng:

> WaveStream là một bản demo nền tảng âm nhạc theo hướng production, có auth thật, storage, playback, playlist, moderation và local deployment theo hướng Docker-first.
