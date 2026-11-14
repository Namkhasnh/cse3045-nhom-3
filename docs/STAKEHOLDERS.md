# Bản đăng ký các bên liên quan — Nhóm 3 CSE3045

- **Đồ án:** Hoa Lac Food Ordering Platform
- **Cập nhật:** 14/11/2026 (Buổi 7 — Các bên liên quan)
- **Người phụ trách:** Nguyễn Nam Khánh (A) · Lê Quang Minh (R, cập nhật mỗi Sprint Review)

## 1. Ma trận quyền lực × quan tâm

|  | **Quan tâm thấp** | **Quan tâm cao** |
| --- | --- | --- |
| **Quyền lực cao** | **Giữ hài lòng:** SH-03 Chủ quán ăn đối tác · SH-04 Nhà trường (phòng Công tác sinh viên) · SH-05 Đơn vị quản trị VPS và tên miền học tập | **Quản lý sát sao:** SH-01 Giảng viên môn CSE3045 |
| **Quyền lực thấp** | **Theo dõi:** SH-06 Nhà cung cấp dịch vụ bên ngoài (Google Gemini, Google Drive, Cloudflare, GitHub) · SH-07 Các nhóm khác trong lớp | **Giữ cho hiểu rõ:** SH-02 Sinh viên VJU (người mua) |

- **Quyền lực:** khả năng quyết định hoặc chặn đồ án: chấm điểm, cho phép dùng điểm nhận trong trường, cho phép bán hàng, tắt máy chủ.
- **Quan tâm:** mức độ bị ảnh hưởng bởi kết quả đồ án và mức chủ động theo dõi.
- Nhóm phát triển (3 thành viên) là bên thực hiện nên không xếp vào ma trận. Vai trò của nhóm nằm trong [TEAM.md](TEAM.md).

## 2. Bản đăng ký

| ID | Bên liên quan | Định danh / đại diện | Vai trò với đồ án | Lợi ích, mong đợi | Quyền lực | Quan tâm | Nhóm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Giảng viên môn CSE3045 | Giảng viên phụ trách lớp, Trường Đại học Việt Nhật | Giao yêu cầu, chấm điểm, duyệt demo mỗi buổi | Đồ án áp dụng đúng nội dung từng buổi; nộp đúng hạn; demo chạy được | Cao | Cao | Quản lý sát sao |
| SH-02 | Sinh viên VJU | Sinh viên ở khu Hòa Lạc; đại diện khảo sát: bạn cùng lớp | Người dùng chính: tìm quán, đặt món COD, nhận tại điểm cố định | Dễ dùng trên điện thoại, giá rõ ràng, đơn không bị sai, dữ liệu cá nhân an toàn | Thấp | Cao | Giữ cho hiểu rõ |
| SH-03 | Chủ quán ăn đối tác | Các quán ăn quanh khu Hòa Lạc (chưa có quán thật ký tham gia) | Quản lý thực đơn, nhận đơn, tự giao hàng và thu tiền | Thêm khách, thao tác nhận đơn nhanh, hoa hồng rõ ràng | Cao | Thấp | Giữ hài lòng |
| SH-04 | Nhà trường | Phòng Công tác sinh viên / ban quản lý khu Hòa Lạc của VJU | Cho phép đặt điểm nhận trong khuôn viên và chạy thử với sinh viên | An toàn, trật tự, không ảnh hưởng uy tín trường, tuân thủ quy định dữ liệu | Cao | Thấp | Giữ hài lòng |
| SH-05 | Đơn vị quản trị VPS và tên miền học tập | Bên cấp máy chủ và tên miền `sv26.bcse-vju.com` | Cung cấp hạ tầng chạy bản demo; có quyền reset hoặc tắt máy chủ | Dùng tài nguyên đúng giới hạn, không gây sự cố bảo mật | Cao | Thấp | Giữ hài lòng |
| SH-06 | Nhà cung cấp dịch vụ bên ngoài | Google (Gemini API, Google Drive), Cloudflare, GitHub | Cung cấp AI gợi ý món, nơi lưu sao lưu, CDN, nơi lưu mã nguồn và CI | Dùng đúng điều khoản và hạn mức miễn phí | Thấp | Thấp | Theo dõi |
| SH-07 | Các nhóm khác trong lớp | Các nhóm cùng lớp CSE3045 | Xem demo, góp ý phản biện | Học hỏi cách làm; góp ý hữu ích | Thấp | Thấp | Theo dõi |

## 3. Chiến lược ứng xử

| Nhóm | Bên liên quan | Chiến lược | Việc cụ thể | Tần suất | Người phụ trách |
| --- | --- | --- | --- | --- | --- |
| Quản lý sát sao | SH-01 Giảng viên | Làm việc chặt chẽ, báo cáo chủ động, xin ý kiến trước thay đổi lớn | Nộp link PR/tag mỗi buổi; demo ở Sprint Review; hỏi lại ngay khi yêu cầu chưa rõ; báo sớm nếu có nguy cơ trễ | Mỗi tuần | Nguyễn Nam Khánh |
| Giữ cho hiểu rõ | SH-02 Sinh viên VJU | Thông tin đầy đủ, lấy góp ý để cải thiện | Khảo sát nhu cầu 5–10 bạn; cho dùng thử bản demo; ghi góp ý thành Issue; viết hướng dẫn sử dụng ngắn | Mỗi Sprint | Lê Quang Minh |
| Giữ hài lòng | SH-03 Chủ quán | Đáp ứng điều họ cần, không làm phiền bằng chi tiết kỹ thuật | Trình bày lợi ích ngắn gọn; chỉ liên hệ quán thật khi có kế hoạch chạy thử được duyệt; thao tác nhận đơn tối giản | Trước mỗi lần chạy thử | Nguyễn Nam Khánh |
| Giữ hài lòng | SH-04 Nhà trường | Tuân thủ quy định, xin phép trước khi tác động thực tế | Chỉ dùng dữ liệu giả cho tới khi được phép; gửi đề xuất điểm nhận và chính sách dữ liệu trước khi chạy thử | Khi chuẩn bị chạy thử (P32) | Nguyễn Nam Khánh |
| Giữ hài lòng | SH-05 Quản trị VPS | Tuân thủ giới hạn tài nguyên, theo dõi thông báo | Giữ dung lượng/bộ nhớ trong hạn mức; sao lưu trước mỗi đợt reset được báo trước; không mở thêm dịch vụ khi chưa được phép | Theo thông báo và trước mỗi lần triển khai | Nguyễn Nam Khánh |
| Theo dõi | SH-06 Nhà cung cấp dịch vụ | Theo dõi định kỳ, ít tốn công | Kiểm tra hạn mức miễn phí Gemini và Drive; đọc thông báo thay đổi điều khoản; có phương án dự phòng khi AI lỗi (đặt món thủ công vẫn chạy) | Mỗi Sprint | Nguyễn Minh Đức |
| Theo dõi | SH-07 Các nhóm khác | Chia sẻ khi có dịp | Nhận góp ý trong buổi demo, ghi lại vào biên bản Sprint Review | Khi demo | Lê Quang Minh |

## 4. Cập nhật bản đăng ký

Xem lại bản đăng ký ở mỗi Sprint Review. Nếu một bên đổi mức quyền lực hoặc quan tâm thì chuyển nhóm và đổi chiến lược. Ví dụ: khi có quán thật đồng ý chạy thử, SH-03 chuyển sang *Quản lý sát sao*. Mọi thay đổi được ghi bằng PR.
