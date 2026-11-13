# Thỏa thuận làm việc nhóm — Nhóm 3 CSE3045

- **Đồ án:** Hoa Lac Food Ordering Platform
- **Cập nhật:** 13/11/2026 (Buổi 6 — Quản lý nhân lực và giao tiếp)
- **Quy trình:** Scrum, Sprint 1 tuần — xem [kế hoạch Scrum Sprint 0](scrum/SPRINT0-SCRUM.md)

## 1. Thành viên

| Thành viên | GitHub | Vai trò Scrum | Chuyên môn chính |
| --- | --- | --- | --- |
| Nguyễn Nam Khánh (trưởng nhóm) | `Namkhasnh` | Product Owner | Backend, CSDL, triển khai |
| Lê Quang Minh | `wqminhh` | Developer, điều phối viên Sprint 0 | Kiểm thử, báo cáo, tài liệu |
| Nguyễn Minh Đức | (bổ sung tài khoản) | Developer, điều phối viên Sprint 1 | Frontend |

## 2. Bảng RACI

**R** = người trực tiếp làm và báo cáo · **A** = người phê duyệt, chịu trách nhiệm cuối cùng · **C** = được hỏi ý kiến trước khi làm · **I** = được thông báo kết quả.

Quy tắc: mỗi mảng có **đúng một A và đúng một R**, và A khác R để luôn có người thứ hai kiểm tra.

| # | Mảng công việc | Nguyễn Nam Khánh | Lê Quang Minh | Nguyễn Minh Đức |
| --- | --- | --- | --- | --- |
| 1 | Phạm vi sản phẩm, Product Backlog, tiêu chí chấp nhận | **A** | **R** | C |
| 2 | Backend, API và cơ sở dữ liệu | **R** | **A** | C |
| 3 | Frontend và trải nghiệm người dùng | **A** | C | **R** |
| 4 | Kiểm thử và bằng chứng kiểm thử | **A** | **R** | C |
| 5 | Triển khai bản demo, sao lưu, bảo mật | **R** | I | **A** |
| 6 | Báo cáo, tài liệu môn học, slide demo | **A** | **R** | C |
| 7 | Điều phối Scrum (họp, bảng công việc, gỡ vướng) | **A** | **R** (Sprint 0) | C |

Giải thích cách hiểu từng mảng:

1. **Phạm vi sản phẩm:** Minh ghi Issue, tách nhỏ việc và cập nhật bảng; Khánh (Product Owner) quyết định thứ tự ưu tiên và chấp nhận kết quả.
2. **Backend:** Khánh viết code và migration; Minh review Pull Request và là người bấm duyệt (approve).
3. **Frontend:** Đức viết giao diện; Khánh review và duyệt vì nắm hợp đồng API.
4. **Kiểm thử:** Minh viết kịch bản, chạy kiểm thử và ghi PASS/FAIL; Khánh xác nhận lỗi nào chặn việc nộp.
5. **Triển khai:** Khánh triển khai lên VPS; Đức kiểm tra lại bản demo trên trình duyệt và điện thoại trước khi xác nhận dùng được.
6. **Báo cáo:** Minh viết báo cáo, biên bản và slide; Khánh duyệt trước khi nộp.
7. **Điều phối:** R là điều phối viên của Sprint hiện tại (xem mục 3); Khánh chịu trách nhiệm cuối cùng để nhóm có đủ các buổi Scrum.

## 3. Luân phiên vai điều phối theo Sprint

Vai điều phối (Scrum Master) luân phiên giữa **Lê Quang Minh** và **Nguyễn Minh Đức**. Khánh là Product Owner nên không kiêm điều phối, chỉ làm dự phòng khi cả hai bận.

| Sprint | Thời gian | Điều phối viên (R mảng 7) | Dự phòng |
| --- | --- | --- | --- |
| Sprint 0 | 13/11/2026 | Lê Quang Minh | Nguyễn Minh Đức |
| Sprint 1 | 16/11 – 22/11/2026 | Nguyễn Minh Đức | Lê Quang Minh |
| Sprint 2 | 23/11 – 29/11/2026 | Lê Quang Minh | Nguyễn Minh Đức |
| Sprint 3 | 30/11 – 06/12/2026 | Nguyễn Minh Đức | Lê Quang Minh |

Các Sprint tiếp theo lặp lại thứ tự Minh → Đức.

Quy trình chuyển giao:

1. Cuối mỗi Sprint, điều phối viên cũ ghi tên điều phối viên mới vào Issue **“Sprint N — Planning”**.
2. Người mới xác nhận bằng bình luận trong Issue đó trước buổi Sprint Planning.
3. Nếu người mới bận, cả nhóm thống nhất người thay trong cùng Issue trước khi Sprint bắt đầu. Người dự phòng trong bảng được hỏi trước.
4. Điều phối viên cũ bàn giao: danh sách việc dở, blocker đang mở, ngày giờ các buổi họp.

Việc của điều phối viên: lên lịch và dẫn các buổi Planning, Daily, Review, Retrospective; cập nhật bảng GitHub Projects; nhắc việc trễ; ghi biên bản. Luân phiên **không** thay đổi quyền phê duyệt (A) trong bảng RACI.

## 4. Quy ước giao tiếp

### 4.1. Chọn kênh

| Kênh | Loại | Dùng khi nào | Thời gian phản hồi mong đợi |
| --- | --- | --- | --- |
| Gọi Google Meet / gặp trực tiếp | Đồng bộ | Sprint Planning, Review, Retrospective; tranh luận cần trao đổi qua lại nhanh; sự cố làm hỏng bản demo | Theo lịch họp |
| Nhóm chat Zalo của nhóm | Đồng bộ | Daily Scrum (10 phút, 21:00 mỗi tối); việc gấp cần trả lời trong ngày; báo blocker | Trong 2 giờ (8:00–22:00) |
| GitHub Issues | Bất đồng bộ | Mỗi việc trong backlog, câu hỏi về yêu cầu, lỗi, đề xuất, quyết định | Trong 24 giờ |
| GitHub Pull Request | Bất đồng bộ | Mọi thay đổi code/tài liệu; review; kết quả kiểm tra; chấp nhận | Review trong 24 giờ |

Quy tắc chung:

- Bàn trên chat xong thì **ghi kết luận vào Issue/PR liên quan**. Chat chỉ để trao đổi, không phải nơi lưu quyết định.
- Mỗi cuộc thảo luận gắn với đúng Issue/PR của nó, không gộp nhiều chủ đề vào một luồng.
- Không đưa mật khẩu, khóa API, file `.env` hay dữ liệu cá nhân lên GitHub hoặc nhóm chat.

### 4.2. Cách ghi lại quyết định

Mọi quyết định ảnh hưởng tới phạm vi, thiết kế, API, CSDL hoặc lịch nộp được ghi trong một **Issue có nhãn `decision`** theo mẫu:

```markdown
**Vấn đề:** …
**Các phương án:** 1) … 2) …
**Quyết định:** chọn phương án …
**Lý do:** …
**Người quyết định (A):** … — **Ngày:** …
**Ảnh hưởng:** các Issue/PR, tài liệu cần sửa
```

- Pull Request ghi `Closes #<số Issue>`, liệt kê thay đổi, lệnh kiểm tra đã chạy cùng kết quả, và giới hạn còn lại.
- Người A của mảng đó bấm **Approve** trên PR. Đó là bằng chứng chấp nhận.
- Chính sách chưa thống nhất thì để trạng thái **BLOCKED**, không tự đoán rồi làm tiếp.
- Quyết định quan trọng được nhắc lại ngắn gọn trong buổi Sprint Review.

### 4.3. Quy tắc báo tin xấu

Tin xấu gồm: trễ hạn, kiểm thử thất bại, bản demo hỏng, lỗi bảo mật hoặc lộ dữ liệu, không làm kịp phần đã nhận.

1. **Báo sớm:** báo ngay khi biết, chậm nhất trong Daily Scrum gần nhất. Không đợi đến hạn mới nói.
2. **Báo đủ ý** theo 5 điểm:
   - Chuyện gì đã xảy ra
   - Ảnh hưởng tới việc nào, hạn nào
   - Đã biết gì và chưa biết gì
   - Đã làm gì để hạn chế
   - Cần ai giúp hoặc cần quyết định gì, khi nào cập nhật tiếp
3. **Ghi đúng trạng thái:** dùng FAIL / NOT RUN / BLOCKED trung thực, không ghi PASS cho việc chưa chạy.
4. **Tập trung giải quyết, không đổ lỗi:** Retrospective bàn về quy trình, không bàn về cá nhân.
5. **Sự cố bảo mật** (lộ mật khẩu, khóa API): nhắn riêng ngay cho Khánh để thu hồi khóa, sau đó mới tạo Issue đã lược bỏ thông tin nhạy cảm.

## 5. Rà soát thỏa thuận

Rà soát tài liệu này ở mỗi buổi Retrospective và khi thành viên hoặc lịch rảnh thay đổi. Mọi thay đổi về RACI hoặc lịch luân phiên được ghi bằng một Issue có ghi ngày và cập nhật vào file này qua Pull Request.
