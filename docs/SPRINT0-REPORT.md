# Báo cáo hoàn thiện Sprint 0 — Nhóm 3 CSE3045

- **Đồ án:** Hoa Lac Food Ordering Platform
- **Ngày báo cáo:** 13/11/2026
- **Người lập:** Lê Quang Minh (điều phối viên Sprint 0) · **Phê duyệt:** Nguyễn Nam Khánh (Product Owner)
- **Backlog gốc:** [Kế hoạch Scrum và backlog Sprint 0 (Buổi 4)](scrum/SPRINT0-SCRUM.md#3-backlog-sprint-0) · **Phân vai:** [TEAM.md](TEAM.md)

## 1. Tóm tắt

| Trạng thái | Số hạng mục | Hạng mục |
| --- | --- | --- |
| Xong | 10 | S0-02 → S0-11 |
| Đang dở | 3 | S0-01, S0-12, S0-13 |
| Bỏ | 0 | — (thanh toán QR cho đơn mới được bỏ khỏi phạm vi của S0-09, xem ghi chú) |

**Sprint Goal** (“xem quán → chọn món → đặt đơn COD → quán nhận và xử lý đơn”, đủ để demo) **đã đạt**. Luồng này chạy trên bản demo <https://sv26.bcse-vju.com>, triển khai cho buổi demo ngày 24/10/2026.

Các hạng mục còn dở đều thuộc về quy trình và tài liệu: bảng công việc, kịch bản kiểm thử thủ công, slide. Cả 3 được chuyển sang Sprint 1.

## 2. Trạng thái từng hạng mục backlog Sprint 0

Cột “Thực hiện theo commit” ghi tác giả commit thực tế trên GitHub. Cột này có thể khác người được giao trong kế hoạch.

| ID | Hạng mục | Giao cho | Trạng thái | Bằng chứng | Thực hiện theo commit | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| S0-01 | Repo, bảo vệ `main`, bảng GitHub Projects, quy ước PR | Lê Quang Minh | **Đang dở** | Khởi tạo repo [b72dafc](https://github.com/Namkhasnh/cse3045-nhom-3/commit/b72dafc); CI cho PR [54e8412](https://github.com/Namkhasnh/cse3045-nhom-3/commit/54e8412) qua [PR #5](https://github.com/Namkhasnh/cse3045-nhom-3/pull/5) | Nguyễn Nam Khánh | Đã làm việc qua PR (#1–#18). **Chưa xong:** nhánh mặc định `hw1` chưa bật bảo vệ (nhánh `main` cũ dừng ở commit d6c2315); repo chưa có Issue và chưa có bảng Projects → chuyển sang S1-01 |
| S0-02 | Tài liệu yêu cầu MVP, 3 vai người dùng | Nguyễn Nam Khánh | **Xong** | [a9a8b24](https://github.com/Namkhasnh/cse3045-nhom-3/commit/a9a8b24) ([PR #2](https://github.com/Namkhasnh/cse3045-nhom-3/pull/2)), [8d4e9ca](https://github.com/Namkhasnh/cse3045-nhom-3/commit/8d4e9ca) ([PR #3](https://github.com/Namkhasnh/cse3045-nhom-3/pull/3)) | Nguyễn Nam Khánh | [requirements.md](requirements.md) có US01–US20 cho người mua, chủ quán, Admin |
| S0-03 | Khung frontend Vite + React + TS + Tailwind | Nguyễn Minh Đức | **Xong** | [19fa257](https://github.com/Namkhasnh/cse3045-nhom-3/commit/19fa257) ([PR #3](https://github.com/Namkhasnh/cse3045-nhom-3/pull/3)) | Nguyễn Nam Khánh | `frontend/package.json` lần đầu ngày 13/10 |
| S0-04 | Khung backend NestJS + Prisma, kết nối MySQL 9.2 | Nguyễn Nam Khánh | **Xong** | [744dcdf](https://github.com/Namkhasnh/cse3045-nhom-3/commit/744dcdf) ([PR #3](https://github.com/Namkhasnh/cse3045-nhom-3/pull/3)), [d6c2315](https://github.com/Namkhasnh/cse3045-nhom-3/commit/d6c2315) ([PR #4](https://github.com/Namkhasnh/cse3045-nhom-3/pull/4)) | Nguyễn Nam Khánh | |
| S0-05 | Thiết kế CSDL | Nguyễn Nam Khánh | **Xong** | [d00192a](https://github.com/Namkhasnh/cse3045-nhom-3/commit/d00192a) ([PR #7](https://github.com/Namkhasnh/cse3045-nhom-3/pull/7)) | Nguyễn Nam Khánh | [database.md](data/database.md); migration đầu tiên `20261016000000_foundation_accounts_audit` |
| S0-06 | Đăng ký / đăng nhập, xác thực email | Khánh, Đức | **Xong** | [0e27bf9](https://github.com/Namkhasnh/cse3045-nhom-3/commit/0e27bf9) ([PR #8](https://github.com/Namkhasnh/cse3045-nhom-3/pull/8)), [d7a6c31](https://github.com/Namkhasnh/cse3045-nhom-3/commit/d7a6c31) ([PR #9](https://github.com/Namkhasnh/cse3045-nhom-3/pull/9)) | Nguyễn Nam Khánh | Nghiệm thu P02 trong [P02.md](progress/P02.md) |
| S0-07 | Danh sách quán và thực đơn công khai | Khánh, Đức | **Xong** | [39b7ea5](https://github.com/Namkhasnh/cse3045-nhom-3/commit/39b7ea5) ([PR #10](https://github.com/Namkhasnh/cse3045-nhom-3/pull/10)); tìm kiếm [f7460a9](https://github.com/Namkhasnh/cse3045-nhom-3/commit/f7460a9) ([PR #18](https://github.com/Namkhasnh/cse3045-nhom-3/pull/18)) | Nguyễn Nam Khánh | [P04](progress/P04.md), [P05](progress/P05.md) |
| S0-08 | Giỏ hàng giữ lại sau khi đăng nhập | Nguyễn Minh Đức | **Xong** | [39b7ea5](https://github.com/Namkhasnh/cse3045-nhom-3/commit/39b7ea5) ([PR #10](https://github.com/Namkhasnh/cse3045-nhom-3/pull/10)) | Nguyễn Nam Khánh | [P06](progress/P06.md); đăng nhập không tự động đặt đơn |
| S0-09 | Đặt đơn COD tại điểm nhận VJU | Khánh, Đức | **Xong** | [39b7ea5](https://github.com/Namkhasnh/cse3045-nhom-3/commit/39b7ea5) ([PR #10](https://github.com/Namkhasnh/cse3045-nhom-3/pull/10)); chuyển sang chỉ COD [4ebcd03](https://github.com/Namkhasnh/cse3045-nhom-3/commit/4ebcd03) ([PR #14](https://github.com/Namkhasnh/cse3045-nhom-3/pull/14)) | Nguyễn Nam Khánh | [P15](progress/P15.md)–[P16](progress/P16.md), [cod-ordering.md](cod-ordering.md). Phạm vi thay đổi ngày 25/10: **bỏ thanh toán QR cho đơn mới**, chỉ giữ COD |
| S0-10 | Trang quản lý đơn của chủ quán | Nguyễn Minh Đức | **Xong** | [39b7ea5](https://github.com/Namkhasnh/cse3045-nhom-3/commit/39b7ea5); sửa UX [1943a13](https://github.com/Namkhasnh/cse3045-nhom-3/commit/1943a13) ([PR #10](https://github.com/Namkhasnh/cse3045-nhom-3/pull/10)) | Nguyễn Nam Khánh | [P17](progress/P17.md), [mvp-ordering-verification.md](mvp-ordering-verification.md) |
| S0-11 | Dữ liệu mẫu và triển khai bản demo | Nguyễn Nam Khánh | **Xong** (có giới hạn) | [15b7386](https://github.com/Namkhasnh/cse3045-nhom-3/commit/15b7386) ([PR #11](https://github.com/Namkhasnh/cse3045-nhom-3/pull/11)), [e6a8bec](https://github.com/Namkhasnh/cse3045-nhom-3/commit/e6a8bec) ([PR #15](https://github.com/Namkhasnh/cse3045-nhom-3/pull/15)), [7c73fc6](https://github.com/Namkhasnh/cse3045-nhom-3/commit/7c73fc6) ([PR #16](https://github.com/Namkhasnh/cse3045-nhom-3/pull/16)) | Nguyễn Nam Khánh | [demo-deployment.md](demo-deployment.md). Dữ liệu demo là bản sao CSDL phát triển, không phải bộ dữ liệu mẫu riêng. Luồng đăng nhập 3 vai trên VPS **chưa được kiểm thử** → S1-02 |
| S0-12 | Kịch bản kiểm thử thủ công US → PASS/FAIL | Lê Quang Minh | **Đang dở** | Kiểm thử tự động có ở [1943a13](https://github.com/Namkhasnh/cse3045-nhom-3/commit/1943a13) ([mvp-ordering-verification.md](mvp-ordering-verification.md): lint, unit, e2e, integration, Chrome) | Nguyễn Nam Khánh | Chưa có kịch bản thủ công theo từng user story → chuyển sang S1-02 |
| S0-13 | Báo cáo Sprint 0, slide demo, danh sách rủi ro | Lê Quang Minh | **Đang dở** | Kế hoạch và báo cáo này: [PR #21](https://github.com/Namkhasnh/cse3045-nhom-3/pull/21); rủi ro: [RISKS.md](../RISKS.md) | Nguyễn Nam Khánh | Báo cáo và rủi ro đã có; **slide demo chưa có** → chuyển sang S1-03 |

### Ghi chú về bằng chứng

- Backlog Sprint 0 được viết thành văn bản ngày 13/11. Phần lớn code được làm từ 12/10 đến 01/11, **trước khi** backlog được ghi lại. Vì vậy bảng trên đối chiếu ngược từ commit và PR có sẵn: commit chứng minh có thay đổi trong repo, còn bằng chứng nghiệm thu là các file trong `docs/progress/`.
- Theo lịch sử GitHub đến 13/11/2026, gần như mọi commit là của `Namkhasnh` (Nguyễn Nam Khánh). `wqminhh` (Lê Quang Minh) có 1 commit ([716bdff](https://github.com/Namkhasnh/cse3045-nhom-3/commit/716bdff), sửa logo). Nguyễn Minh Đức chưa có commit. Việc phân công từ Sprint 1 ([TEAM.md](TEAM.md)) nhằm cân bằng lại khối lượng việc.
- PR [#19](https://github.com/Namkhasnh/cse3045-nhom-3/pull/19) và [#20](https://github.com/Namkhasnh/cse3045-nhom-3/pull/20) vẫn đang mở, chưa được tính vào Sprint 0.

## 3. Phạm vi Sprint 1 nhóm đang chạy

- **Thời gian:** 16/11 – 22/11/2026 (1 tuần). Sprint Review và Retrospective ngày 22/11.
- **Điều phối viên:** Nguyễn Minh Đức (dự phòng: Lê Quang Minh)
- **Sprint Goal:** đưa quy trình nhóm lên GitHub, kiểm chứng bản demo cho cả 3 vai, và bắt đầu bảo vệ dữ liệu demo bằng sao lưu tự động.

| ID | Product Backlog Item | Liên quan | R | A | SP | Tiêu chí hoàn thành |
| --- | --- | --- | --- | --- | --- | --- |
| S1-01 | Tạo bảng GitHub Projects (To do / In progress / Review / Done), tạo Issue cho mọi PBI Sprint 1, bật bảo vệ nhánh mặc định `hw1` (bắt buộc PR + 1 approve + CI pass) | S0-01 | Nguyễn Minh Đức | Nguyễn Nam Khánh | 1 | Mỗi PBI có Issue trên bảng; push thẳng vào `hw1` bị từ chối |
| S1-02 | Kịch bản kiểm thử thủ công cho người mua, chủ quán, Admin trên bản demo (US01, US03, US05–US07, US13) và ghi PASS/FAIL | S0-11, S0-12 | Lê Quang Minh | Nguyễn Nam Khánh | 3 | File `docs/manual-test-sprint1.md`; mỗi story ≥1 ca; lỗi FAIL được mở Issue |
| S1-03 | Slide demo, biên bản Sprint 0 Review và Retrospective | S0-13 | Lê Quang Minh | Nguyễn Nam Khánh | 2 | Slide dưới 10 trang; biên bản có ít nhất 3 hành động cải tiến |
| S1-04 | Rà soát giao diện trên điện thoại 360 px: trang chủ, thực đơn, giỏ hàng, checkout; sửa lỗi hiển thị | US02, US03, US05 | Nguyễn Minh Đức | Nguyễn Nam Khánh | 3 | PR có ảnh trước/sau; `frontend lint` và `build` pass |
| S1-05 | Review rồi merge hoặc đóng PR #19 (hw5) và PR #20 đang mở | — | Nguyễn Nam Khánh | Lê Quang Minh | 1 | Không còn PR mở quá 1 tuần mà không có ai review |
| S1-06 | Sao lưu tự động CSDL demo trên VPS (cài và cấu hình `rclone`/`age`, lịch chạy hằng ngày, thử khôi phục 1 lần) | [P29](progress/P29.md) | Nguyễn Nam Khánh | Nguyễn Minh Đức | 5 | Có ít nhất 1 bản sao lưu tự động thành công; khôi phục thử thành công trên CSDL tạm |
| S1-07 | Đo thời gian phản hồi của gợi ý món AI trên bản demo và đề xuất cách giảm | US08, [demo-ai-activation.md](demo-ai-activation.md) | Nguyễn Nam Khánh | Lê Quang Minh | 2 | Issue ghi số đo (giây) của 10 lần gọi và phương án đã chọn |

**Tổng:** 17 story point — Khánh 8, Minh 5, Đức 4 cùng với việc điều phối. Nhóm chủ động lấy ít hơn Sprint 0 vì đây là tuần đầu tiên chạy đầy đủ quy trình trên GitHub.

**Ngoài phạm vi Sprint 1:** đánh giá quán, món yêu thích (V1.1); chạy thử với quán thật (P32 cần được cho phép rõ ràng); phát hành V1.0.

## 4. Hành động cải tiến từ Sprint 0

1. Mọi việc phải có Issue **trước khi** bắt đầu làm, để báo cáo Sprint sau không phải đối chiếu ngược từ commit.
2. Mỗi thành viên tự mở PR cho phần mình phụ trách, để lịch sử GitHub phản ánh đúng phân công.
3. Đặt tên PR theo nội dung (ví dụ `feat: trang giỏ hàng`), không dùng tên chung như “update 3”.
