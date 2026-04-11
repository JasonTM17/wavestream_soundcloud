# WaveStream Case Study

[English](./CASE-STUDY.md) | Tiếng Việt

WaveStream là một dự án portfolio về nền tảng nghe nhạc được xây dựng theo hướng gần với sản phẩm thật, không chỉ là một demo chức năng đơn lẻ. Dự án được phát triển trong portfolio của Nguyễn Sơn, và nếu bạn muốn trao đổi về dự án hoặc hợp tác, có thể liên hệ qua `jasonbmt06@gmail.com`.

## Tổng Quan

WaveStream mô phỏng trải nghiệm của một nền tảng streaming âm nhạc hiện đại với đầy đủ các lớp tương tác cốt lõi: khám phá nội dung, phát nhạc, quản lý playlist, theo dõi nghệ sĩ, thích bài hát, bình luận, báo cáo nội dung và khu vực quản trị. Mục tiêu của dự án là chứng minh khả năng thiết kế một hệ thống web end-to-end có cấu trúc rõ ràng, trải nghiệm mượt, và có thể chạy ổn định trong môi trường local bằng Docker.

Dự án được tổ chức như một pnpm monorepo, giúp tách biệt frontend, API và các gói chia sẻ nhưng vẫn giữ được tính đồng bộ về kiểu dữ liệu, validation và quy ước phát triển. Cách tổ chức này giúp WaveStream dễ bảo trì hơn và phản ánh đúng tư duy xây dựng sản phẩm nhiều thành phần.

## Product Vision

Tầm nhìn của WaveStream là tạo ra một trải nghiệm nghe nhạc vừa thân thiện với người dùng phổ thông vừa đủ chiều sâu cho creator và admin. Thay vì chỉ dừng ở việc “phát được file âm thanh”, sản phẩm hướng tới một luồng sử dụng trọn vẹn:

- Người nghe có thể khám phá, lưu, phát lại và tương tác với nội dung.
- Creator có thể quản lý track, tải lên nội dung và theo dõi số liệu cơ bản.
- Admin có thể xem báo cáo, kiểm tra đối tượng vi phạm và xử lý moderation có ngữ cảnh.

Điểm quan trọng của vision này là tính liên tục của trải nghiệm. Người dùng không bị ngắt mạch khi chuyển trang, còn trạng thái phát nhạc vẫn được giữ ổn định trong quá trình điều hướng.

## Target Users

WaveStream được thiết kế cho ba nhóm người dùng chính:

Người nghe là nhóm sử dụng thường xuyên nhất. Họ cần một giao diện nhanh, dễ tìm nhạc, dễ thao tác và ít ma sát khi chuyển từ khám phá sang nghe lại.

Creator là nhóm cần công cụ rõ ràng để quản lý track của chính họ. Họ quan tâm đến quy trình upload, trạng thái nội dung, và việc theo dõi hiệu quả ở mức dashboard.

Admin là nhóm cần công cụ đáng tin cậy hơn là đẹp mắt. Họ cần hành động nhanh, có bối cảnh, và có thể truy vết khi xử lý các report hoặc nội dung nhạy cảm.

## Core Capabilities

Phần trải nghiệm công khai tập trung vào discovery, tìm kiếm, phát nhạc, playlist, follow, like, repost và comment. Điều này giúp WaveStream giống một sản phẩm giải trí thực sự thay vì chỉ là một bản demo CRUD.

Phần creator hỗ trợ upload và quản lý track của riêng mình. Việc này làm rõ luồng sở hữu nội dung và giúp kiểm thử phân quyền giữa người tạo nội dung và người nghe.

Phần admin bổ sung moderation queue, xem trước target và các thao tác xử lý có kiểm soát. Đây là một lớp chức năng quan trọng để chứng minh hệ thống đã nghĩ tới vận hành, không chỉ nghĩ tới hiển thị.

Ngoài ra, WaveStream còn có audio player cố định, queue trạng thái riêng và hành vi phát nhạc bền vững khi chuyển route. Đây là một trong những phần tạo cảm giác “sản phẩm thật” rõ nhất.

## Technical Architecture

WaveStream sử dụng kiến trúc monorepo với các thành phần chính:

- `apps/web`: Next.js App Router cho trải nghiệm public, auth shell, app shell và player runtime.
- `apps/api`: NestJS API cho auth, track, playlist, discovery, admin, analytics, storage và health checks.
- `packages/shared`: nơi đặt enums, DTO, pagination contracts và validation helpers dùng chung.
- `docker-compose.yml`: orchestration local cho toàn bộ stack.
- `docker/`: các Dockerfile theo hướng production cho web và API.

Stack hạ tầng gồm PostgreSQL, Redis, MinIO và Mailpit. PostgreSQL xử lý dữ liệu chính, Redis hỗ trợ cache và rate limiting, MinIO lưu file media, còn Mailpit giúp kiểm tra luồng email như reset password mà không cần hạ tầng mail thật.

Thiết kế này cho phép chạy toàn bộ hệ thống theo hướng “local nhưng giống production”, giúp dễ demo, dễ debug và dễ chứng minh kiến thức triển khai.

## Key Engineering Decisions

Một quyết định quan trọng là ưu tiên monorepo thay vì tách rời hoàn toàn từng app. Cách này giúp chia sẻ contract và validation một cách có kiểm soát, giảm nguy cơ lệch schema giữa frontend và backend.

Một quyết định khác là dùng Docker làm đường chạy chuẩn cho môi trường local. Điều đó giúp khởi tạo stack nhất quán hơn và giảm phụ thuộc vào cấu hình máy từng người.

Ở tầng trải nghiệm, việc giữ player state bền vững khi điều hướng được xem là requirement cốt lõi. Đây là chi tiết nhỏ nhưng tác động lớn đến cảm nhận của người dùng, nhất là với một sản phẩm media.

Ở tầng API, việc tách rõ domain như auth, tracks, playlists, discovery, admin và analytics giúp hệ thống dễ mở rộng hơn. Mỗi domain có ranh giới trách nhiệm rõ ràng nên cũng dễ viết test và bảo trì hơn.

## Challenges Solved

Thách thức lớn nhất là làm sao để dự án không giống một bộ demo rời rạc. Tôi giải quyết bằng cách thiết kế luồng sử dụng end-to-end, từ landing page đến playback, từ upload đến moderation, rồi từ reset password đến email verification.

Một thách thức khác là giữ cho trạng thái phát nhạc ổn định khi người dùng di chuyển giữa các trang. Điều này đòi hỏi kiến trúc UI phải coi player như một runtime độc lập, không phụ thuộc vào từng route con.

Việc quản lý nhiều vai trò người dùng cũng tạo ra bài toán phân quyền và trải nghiệm. Thay vì trộn các chức năng vào cùng một giao diện, tôi tách luồng theo ngữ cảnh để người nghe, creator và admin mỗi nhóm đều có điểm vào phù hợp.

Cuối cùng, việc dựng một local stack đầy đủ với dữ liệu seed, storage, email và migration giúp loại bỏ nhiều “điểm mù” thường gặp ở dự án portfolio. Khi demo, mọi thành phần quan trọng đều có thể kiểm chứng ngay.

## QA / DevOps

WaveStream được kiểm tra bằng một chuỗi công việc rõ ràng: lint, typecheck, test, build, Playwright end-to-end và smoke test qua Docker. Mục tiêu không chỉ là pass CI mà còn giữ chất lượng ổn định cho toàn hệ thống.

Việc chuẩn hoá chạy local qua Docker Compose giúp QA dễ lặp lại. Một môi trường khởi tạo tốt cho phép kiểm tra migrations, seed data, email flow và storage flow mà không cần cấu hình thủ công nhiều lần.

Ngoài ra, CI/CD được dùng như một lớp xác nhận rằng dự án có thể đi từ code đến image và đến môi trường chạy một cách có kỷ luật. Điều này đặc biệt quan trọng với một portfolio project muốn thể hiện tư duy kỹ thuật hoàn chỉnh.

## What I Learned

Dự án giúp tôi hiểu rõ hơn cách kết nối giữa kiến trúc sản phẩm và trải nghiệm người dùng. Một tính năng nghe có vẻ nhỏ, như giữ player không bị reset khi đổi trang, thực tế lại phản ánh rất nhiều về chất lượng kiến trúc phía sau.

Tôi cũng học được rằng một dự án portfolio tốt cần kể được câu chuyện về hệ thống chứ không chỉ kể danh sách tính năng. Khi mọi phần đều có lý do tồn tại, người xem sẽ dễ tin rằng đây là một sản phẩm được thiết kế có chủ đích.

Về mặt kỹ thuật, WaveStream củng cố cho tôi cách tổ chức monorepo, chuẩn hóa contract giữa các tầng và dựng môi trường phát triển đáng tin cậy hơn. Những thứ này tạo nền rất tốt cho các dự án lớn hơn sau này.

## Next Steps

- Hoàn thiện thêm analytics theo chiều sâu cho creator và admin.
- Mở rộng khả năng tìm kiếm và discovery để gợi ý nội dung thông minh hơn.
- Cải thiện trải nghiệm mobile và tối ưu cảm giác điều khiển player.
- Thêm thêm nhiều test theo luồng người dùng thực tế để tăng độ tin cậy.
- Tinh chỉnh monitoring và observability để việc vận hành rõ ràng hơn.

WaveStream được xây dựng như một bản thể hiện năng lực toàn diện: từ product thinking, kiến trúc hệ thống cho đến vận hành và demo. Nếu bạn đang xem dự án này như một mẫu portfolio, hy vọng nó truyền tải được tinh thần của Nguyễn Sơn cũng như sự chỉn chu mà tôi muốn đặt vào từng lớp của sản phẩm.
