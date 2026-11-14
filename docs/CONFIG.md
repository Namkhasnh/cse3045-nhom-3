# Kế hoạch quản lý cấu hình (rút gọn) — Nhóm 3 CSE3045

- **Đồ án:** Hoa Lac Food Ordering Platform
- **Cập nhật:** 14/11/2026 (Buổi 7 — Quản lý cấu hình)
- **Người phụ trách tài liệu:** Nguyễn Nam Khánh (A) · Lê Quang Minh (R)
- **Liên quan:** [TEAM.md](TEAM.md) (RACI) · [GIT.md](GIT.md) (nhánh, PR) · [STAKEHOLDERS.md](STAKEHOLDERS.md)

Tài liệu trả lời 7 câu hỏi của kế hoạch quản lý cấu hình. Mốc phát hành hiện tại là **`v0.8.0`**, gắn ngày 14/11/2026 vào commit [`0687f56`](https://github.com/Namkhasnh/cse3045-nhom-3/commit/0687f56) trên nhánh mặc định `hw1`. Đây là điểm bắt đầu của Sprint 1.

## 1. Quản lý những gì (các phần tử cấu hình)

| Nhóm | Phần tử cấu hình | Vị trí | Lưu ở đâu |
| --- | --- | --- | --- |
| Mã nguồn | Frontend React/Vite/TypeScript | `frontend/` | Git |
| Mã nguồn | Backend NestJS/TypeScript | `backend/` | Git |
| Cơ sở dữ liệu | Lược đồ Prisma và migration (hiện có 36 migration) | `backend/prisma/schema.prisma`, `backend/prisma/migrations/` | Git |
| Phụ thuộc | Phiên bản thư viện đã khóa | `frontend/package-lock.json`, `backend/package-lock.json` | Git |
| Cấu hình chạy | Mẫu biến môi trường (chỉ tên biến, không có giá trị bí mật) | `backend/.env.example` | Git |
| Tài liệu baseline | Yêu cầu, kiến trúc, hợp đồng API, thiết kế CSDL, roadmap | `docs/requirements.md`, `docs/architecture.md`, `docs/data/` | Git |
| Tài liệu quản lý | Scrum, RACI, báo cáo Sprint, cấu hình, các bên liên quan | `docs/scrum/`, `docs/*.md` | Git |
| Tự động hóa | CI GitHub Actions | `.github/workflows/ci.yml` | Git |
| Triển khai | Script triển khai, sao lưu, khôi phục | `ops/` | Git |
| Bản phát hành | Tag SemVer và GitHub Release | Tag `vX.Y.Z` | GitHub |
| Ảnh Docker | `hlf-backend`, `hlf-frontend`, `hlf-schema`, `hlf-release` | `ghcr.io/namkhasnh/…` | GitHub Container Registry |

**Không đưa vào Git:** file `.env` thật, mật khẩu, khóa API (Gemini, SMTP), khóa MFA, khóa giải mã `age`, dữ liệu CSDL và ảnh người dùng tải lên. Các phần này được quản lý bằng sao lưu mã hóa (mục 7).

## 2. Vai trò và trách nhiệm

| Vai trò | Người | Trách nhiệm |
| --- | --- | --- |
| Quản lý cấu hình, phát hành | Nguyễn Nam Khánh | Duyệt baseline, tạo tag và GitHub Release, triển khai bản demo, quản lý bí mật |
| Thư ký cấu hình | Lê Quang Minh | Ghi Issue thay đổi, cập nhật bảng mốc (mục 4) và changelog trong Release, kiểm tra PR có link Issue |
| Phụ trách cấu hình frontend | Nguyễn Minh Đức | Giữ `frontend/package-lock.json` nhất quán, báo khi nâng phiên bản thư viện |
| Hội đồng kiểm soát thay đổi (CCB) | Cả 3 người; Khánh quyết định cuối | Duyệt thay đổi baseline: yêu cầu, API, lược đồ CSDL, phạm vi Sprint |

Quyền phê duyệt từng mảng theo bảng RACI trong [TEAM.md](TEAM.md#2-bảng-raci).

## 3. Công cụ

| Mục đích | Công cụ |
| --- | --- |
| Quản lý phiên bản | Git, GitHub (repo `Namkhasnh/cse3045-nhom-3`) |
| Theo dõi thay đổi | GitHub Issues, GitHub Projects, Pull Request |
| Kiểm tra tự động | GitHub Actions: lint, unit test, build frontend/backend, kiểm thử MySQL 9.2.0 |
| Khóa phụ thuộc | npm + `package-lock.json` (cài bằng `npm ci`) |
| Phiên bản CSDL | Prisma Migrate (chỉ migration tiến, không sửa migration đã áp dụng) |
| Đóng gói, triển khai | Docker, GitHub Container Registry, script trong `ops/` |
| Sao lưu | `age` (mã hóa), Google Drive (bản sao ngoài máy), script `ops/recovery/` |

## 4. Điểm mốc (baseline)

### 4.1. Quy ước SemVer

Phiên bản có dạng **`MAJOR.MINOR.PATCH`** theo [Semantic Versioning 2.0.0](https://semver.org/lang/vi/):

| Thành phần | Tăng khi nào | Ví dụ |
| --- | --- | --- |
| MAJOR | Phát hành chính thức cho người dùng thật (V1.0 trong roadmap) hoặc thay đổi không tương thích sau V1.0 | `0.9.0` → `1.0.0` |
| MINOR | Hoàn thành và nghiệm thu một mốc roadmap V0.x (thêm tính năng tương thích) | `0.8.0` → `0.9.0` |
| PATCH | Cuối Sprint chỉ có sửa lỗi, tài liệu, cải thiện nhỏ, chưa xong mốc mới | `0.8.0` → `0.8.1` |
| Hậu tố thử nghiệm | Bản ứng viên trước khi nghiệm thu mốc | `0.9.0-rc.1` |

- Khi MAJOR còn là `0`, hệ thống đang phát triển, chưa cam kết ổn định cho người dùng thật.
- Số MINOR khớp với mốc roadmap: roadmap **V0.x** ↔ tag **`v0.x.0`**. Vì V0.1–V0.8 đã được nghiệm thu ở môi trường local, mốc đầu tiên được gắn tag là `v0.8.0`.

### 4.2. Gắn tag mỗi mốc phát hành

1. Chỉ gắn tag trên commit đã merge vào nhánh mặc định `hw1` và CI đã pass.
2. Dùng **annotated tag**, tên `vX.Y.Z`. Lời nhắn ghi Sprint, mốc roadmap và các PR chính:
   ```sh
   git checkout hw1 && git pull
   git tag -a v0.8.1 -m "Sprint 1: <tóm tắt>; gồm #22, #23"
   git push origin v0.8.1
   ```
3. Tạo **GitHub Release** từ tag; mô tả liệt kê thay đổi, kết quả kiểm tra và giới hạn còn lại.
4. **Không xóa, không di chuyển** tag đã đẩy lên. Lỡ gắn sai thì tạo tag PATCH mới.
5. Ảnh Docker triển khai mang đúng commit của tag đó.

### 4.3. Bảng mốc

| Tag | Ngày | Commit | Nội dung | Trạng thái |
| --- | --- | --- | --- | --- |
| `v0.8.0` | 14/11/2026 | [`0687f56`](https://github.com/Namkhasnh/cse3045-nhom-3/commit/0687f56) | Baseline đầu Sprint 1: V0.1–V0.8 (tài khoản, danh mục, đặt đơn COD, quản lý quán, đối soát, gợi ý AI), tài liệu Sprint 0 ([PR #21](https://github.com/Namkhasnh/cse3045-nhom-3/pull/21)) | Đã gắn tag |
| `v0.8.1` | 22/11/2026 (dự kiến) | — | Kết quả Sprint 1: kiểm thử 3 vai, sửa giao diện 360 px, sao lưu tự động | Kế hoạch |
| `v0.9.0` | Chưa xác định | — | Mốc V0.9: staging, CI/CD, khôi phục, chạy thử với quán thật | Đang bị chặn (P29) |
| `v1.0.0` | Chưa xác định | — | Phát hành chính thức V1.0 | Cần phê duyệt phát hành |

Các baseline tài liệu (yêu cầu, API, CSDL) được hiểu là nội dung của các file đó **tại tag tương ứng**.

## 5. Quy ước đặt tên

| Đối tượng | Quy ước | Ví dụ |
| --- | --- | --- |
| Tag phát hành | `vMAJOR.MINOR.PATCH[-rc.N]` | `v0.8.0`, `v0.9.0-rc.1` |
| Nhánh | `<loại>/<mô-tả-ngắn>`, xem [GIT.md](GIT.md) | `feat/s1-04-mobile-checkout` |
| Commit | Conventional Commits: `<loại>: <mô tả>` | `fix: sửa tràn chữ ở giỏ hàng 360px` |
| Issue | `[<ID PBI>] <mô tả>` | `[S1-02] Kịch bản kiểm thử thủ công 3 vai` |
| Migration Prisma | `YYYYMMDDHHMMSS_<mô_tả_snake_case>` | `20261016000000_foundation_accounts_audit` |
| Tài liệu quản lý | Chữ in hoa trong `docs/` | `docs/CONFIG.md` |
| Tài liệu kỹ thuật | Chữ thường nối gạch ngang | `docs/cod-ordering.md` |
| Ảnh Docker | `ghcr.io/namkhasnh/hlf-<thành phần>` | `ghcr.io/namkhasnh/hlf-backend` |

## 6. Quy ước thay đổi

1. **Yêu cầu thay đổi:** mở Issue mô tả thay đổi, lý do, phần tử cấu hình bị ảnh hưởng.
2. **Đánh giá:**
   - Thay đổi thường (sửa lỗi, giao diện nhỏ): người A của mảng duyệt trong Issue.
   - Thay đổi **baseline** (yêu cầu, API, lược đồ CSDL, phạm vi Sprint): CCB quyết định bằng Issue nhãn `decision` theo mẫu trong [TEAM.md](TEAM.md#42-cách-ghi-lại-quyết-định).
3. **Thực hiện:** tạo nhánh từ `hw1`, làm thay đổi, mở Pull Request ghi `Closes #<Issue>`.
4. **Kiểm tra:** CI pass và người A approve. Thay đổi CSDL phải có migration mới, chạy thử trên CSDL tạm.
5. **Ghi nhận:** merge bằng *Create a merge commit*. Thư ký cấu hình cập nhật bảng mốc. Cuối Sprint, Khánh gắn tag.
6. **Quay lui:** triển khai lại tag trước đó (`ops/demo/rollback.sh`). Lỗi CSDL được sửa bằng migration tiến mới, không sửa migration cũ.

Không được: push thẳng vào `hw1`, sửa migration đã áp dụng, `git push --force` lên nhánh dùng chung, đưa bí mật vào commit.

## 7. Sao lưu

| Đối tượng | Cách sao lưu | Tần suất | Trạng thái |
| --- | --- | --- | --- |
| Mã nguồn, tài liệu, tag | GitHub là bản gốc; mỗi thành viên giữ một bản clone đầy đủ | Mỗi lần push | Đang chạy |
| CSDL phát triển trên Mac | `node ops/recovery/backup-to-drive.mjs`: dump SQL → mã hóa `age` → khôi phục thử → tải lên Google Drive | Cuối mỗi buổi làm việc và trước thay đổi lớn | Đã kiểm chứng ([quy trình](mac-backup-verification.md)) |
| CSDL, ảnh, bí mật của bản demo VPS | `python3 ops/recovery/backup-vps.py`: bản sao mã hóa lên Google Drive | Thủ công, trước mỗi lần cập nhật bản demo | Đã làm thủ công ([quy trình](vps-manual-backup.md)); **sao lưu tự động chưa cấu hình** → việc S1-06 |
| Bí mật (`.env`, khóa MFA, khóa API) | Nằm trong bản sao lưu mã hóa; không đưa lên Git | Theo bản sao lưu VPS | Đang chạy |
| Khóa giải mã `age` | Chỉ giữ ngoài Git và ngoài Google Drive | — | Bản sao offline (USB) **chưa kiểm chứng** |

Mỗi bản sao lưu phải được khôi phục thử ít nhất một lần lên CSDL tạm thì mới được tính là dùng được.
