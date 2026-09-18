# Project Charter Mini

## 1. Tên dự án

**Tên dự án:**  
**KRead AI — AI-Powered Context-Aware Scientific Document Translation and Bilingual Reading Platform**

**Tên tiếng Việt:**  
**Nền tảng dịch và đọc tài liệu khoa học song ngữ theo ngữ cảnh sử dụng trí tuệ nhân tạo**

---

## 2. Mục tiêu dự án

KRead AI hướng tới xây dựng một nền tảng web hỗ trợ sinh viên, người làm nghiên cứu và người đọc tài liệu kỹ thuật có thể tải lên tài liệu PDF ngoại ngữ và đọc bản dịch song ngữ mà không cần tự chia nhỏ nội dung rồi copy-paste từng đoạn vào Google Translate hoặc ChatGPT.

Mục tiêu chính của phiên bản đầu tiên là:

- Hỗ trợ upload tài liệu PDF có lớp text.
- Phân tích tài liệu theo đúng thứ tự đọc.
- Dịch nội dung bằng AI có sử dụng ngữ cảnh của toàn tài liệu.
- Giữ tính nhất quán của thuật ngữ, acronym, tên phương pháp, dataset và model xuyên suốt tài liệu.
- Giữ lại các thành phần khoa học quan trọng như hình ảnh, biểu đồ và công thức toán.
- Cho phép người dùng xem trước một phần bản dịch miễn phí trước khi quyết định thanh toán.
- Mô phỏng quy trình thương mại thông qua chức năng báo giá và thanh toán ở môi trường sandbox.
- Cung cấp trình đọc song ngữ để người dùng có thể tiếp tục đọc tài liệu đã dịch.

Mục tiêu của V1 không phải hỗ trợ mọi loại PDF mà là chứng minh giá trị cốt lõi của sản phẩm:

> **Người dùng có thể upload tài liệu một lần và đọc bản dịch song ngữ có giữ ngữ cảnh mà không phải tự quản lý từng đoạn dịch.**

---

## 3. Phạm vi dự án

### 3.1. Trong phạm vi V1 — Làm gì

Phiên bản V1 tập trung vào một quy trình hoàn chỉnh:

```text
Đăng ký / Đăng nhập
        ↓
Upload PDF
        ↓
Chọn ngôn ngữ
        ↓
Phân tích tài liệu
        ↓
Xây dựng context
        ↓
Dịch thử miễn phí
        ↓
Hiển thị giá dự kiến
        ↓
Thanh toán sandbox
        ↓
Dịch phần còn lại
        ↓
Hiển thị tiến độ
        ↓
Đọc tài liệu song ngữ
```

Các chức năng chính:

- Đăng ký, đăng nhập bằng email và mật khẩu.
- Upload **PDF text-based, single-column**.
- Chọn ngôn ngữ nguồn và ngôn ngữ đích.
- Parse tài liệu và giữ đúng thứ tự nội dung.
- Nhận diện các block cơ bản như:
  - heading;
  - paragraph;
  - figure/image;
  - equation;
  - caption.
- Giữ lại hình ảnh, biểu đồ và công thức toán.
- Chia nội dung thành các chunk để xử lý.
- Sử dụng **Context Manager** để duy trì:
  - global paper context;
  - section context;
  - previous context;
  - terminology memory.
- Dịch thử miễn phí một phần tài liệu.
- Ước tính chi phí trước khi dịch toàn bộ.
- Thanh toán ở chế độ sandbox/test.
- Hiển thị tiến độ dịch.
- Retry riêng chunk bị lỗi.
- Reader dạng:
  - nội dung gốc phía trên;
  - bản dịch phía dưới.
- My Library để lưu và mở lại tài liệu.
- Resume Reading cơ bản.
- Các giới hạn cơ bản về dung lượng file, số trang và số tài liệu để tránh lạm dụng.

### 3.2. Ngoài phạm vi V1 — Không làm gì

Các chức năng sau **không thuộc V1**:

- PDF scan và OCR.
- PDF nhiều cột, đặc biệt là PDF khoa học 2 cột.
- EPUB.
- Manga/comics.
- Tái tạo pixel-perfect layout của PDF gốc.
- Side-by-side reader.
- Search trong tài liệu.
- Bookmark.
- Highlight.
- Notes.
- Click-to-Explain.
- Export PDF/EPUB song ngữ.
- Storage dashboard.
- Mua thêm dung lượng.
- Subscription.
- BYOK — Bring Your Own API Key.
- Google/GitHub login.
- Cổng thanh toán production.

Các chức năng này có thể được phát triển trong V1.5 hoặc V2 sau khi core translation pipeline hoạt động ổn định.

---

## 4. Các bên liên quan

### 4.1. Nhóm phát triển dự án

Chịu trách nhiệm:

- phân tích yêu cầu;
- quản lý phạm vi;
- thiết kế hệ thống;
- phát triển frontend/backend;
- xây dựng AI translation pipeline;
- kiểm thử;
- triển khai;
- quản lý chi phí API và tài nguyên.

### 4.2. Người dùng chính

Bao gồm:

- sinh viên đọc tài liệu chuyên ngành;
- sinh viên làm khóa luận;
- người làm nghiên cứu;
- người đọc paper khoa học;
- người đọc tài liệu kỹ thuật bằng ngoại ngữ.

Đây là nhóm trực tiếp sử dụng sản phẩm và đánh giá chất lượng dịch, tính nhất quán thuật ngữ và khả năng giữ cấu trúc tài liệu.

### 4.3. Giảng viên / học phần CSE3045

Là bên đánh giá dự án về:

- phạm vi;
- tiến độ;
- quản lý dự án;
- chất lượng sản phẩm;
- khả năng triển khai;
- khả năng kiểm thử;
- tính khả thi của mô hình sản phẩm.

### 4.4. Các dịch vụ bên ngoài

Dự án có thể phụ thuộc vào:

- nhà cung cấp LLM/API;
- local LLM thông qua Ollama trong quá trình benchmark;
- dịch vụ authentication;
- database;
- dịch vụ lưu trữ;
- payment sandbox.

---

## 5. Ba ràng buộc chính của dự án

### 5.1. Phạm vi — Scope

Phạm vi V1 được giới hạn có chủ đích để giảm rủi ro kỹ thuật.

V1 chỉ xử lý:

> **PDF có lớp text và bố cục single-column.**

Dự án ưu tiên ba giá trị cốt lõi:

1. Dịch đúng ngữ cảnh.
2. Giữ nhất quán thuật ngữ.
3. Giữ hình ảnh và công thức theo đúng thứ tự logic.

Các tính năng không trực tiếp chứng minh giá trị cốt lõi sẽ được chuyển sang V1.5 hoặc V2.

---

### 5.2. Thời gian — Time

Dự án được thực hiện trong thời gian của học phần **CSE3045**.

Vì thời gian có giới hạn, quá trình phát triển ưu tiên làm phần có rủi ro kỹ thuật cao nhất trước:

```text
1. Parser + Chunking + Context Manager + LLM
2. Minimal Reader
3. Database / Persistence
4. Auth + My Library
5. Free Preview + Pricing
6. Sandbox Payment
7. Testing + Deployment + UI Polish
```

Mục tiêu là có một phiên bản V1 chạy được end-to-end trước khi mở rộng thêm chức năng.

**Mốc thời gian chi tiết sẽ được xây dựng sau trong WBS và Gantt Chart.**

---

### 5.3. Chi phí — Cost

Chi phí của dự án cần được kiểm soát chặt vì AI translation sử dụng tài nguyên theo số lượng token và độ dài tài liệu.

Các khoản chi phí chính có thể gồm:

- LLM API;
- VPS/server;
- database;
- file storage;
- authentication service;
- các dịch vụ triển khai liên quan.

Để giảm chi phí:

- giới hạn dung lượng và số trang của tài liệu;
- chỉ dịch thử một phần trước khi người dùng thanh toán;
- không gửi toàn bộ paper vào context mỗi lần;
- sử dụng hierarchical context và terminology memory;
- benchmark nhiều cloud LLM;
- benchmark local LLM thông qua Ollama;
- so sánh chất lượng, tốc độ và chi phí trước khi chọn model chính.

Trong V1, thanh toán chỉ sử dụng **sandbox/test mode**, vì vậy chưa yêu cầu triển khai cổng thanh toán production thực tế.

Giá bán và ngân sách vận hành cụ thể **chưa được cố định** mà sẽ được xác định sau khi benchmark chi phí thực tế.

---

## 6. Tóm tắt Project Charter

| Thành phần | Nội dung |
|---|---|
| **Tên dự án** | KRead AI |
| **Sản phẩm** | Nền tảng dịch và đọc tài liệu khoa học song ngữ theo ngữ cảnh |
| **Người dùng chính** | Sinh viên, người làm nghiên cứu, người đọc paper/tài liệu kỹ thuật |
| **Core AI** | Context-aware long-document translation |
| **Input V1** | PDF text-based, single-column |
| **Output V1** | Reader song ngữ original-above / translation-below |
| **Điểm khác biệt** | Giữ context, thuật ngữ, hình ảnh và công thức |
| **Mô hình thử nghiệm kinh doanh** | Free Preview → Price Estimate → Sandbox Payment → Full Translation |
| **Scope constraint** | Không OCR, không EPUB, không PDF 2-column trong V1 |
| **Time constraint** | Hoàn thành trong thời gian học phần CSE3045 |
| **Cost constraint** | Kiểm soát token/API/server/storage; benchmark cloud và local LLM trước khi chốt chi phí |
