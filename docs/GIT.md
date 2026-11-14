# Quy ước Git, nhánh và Pull Request — Nhóm 3 CSE3045

- **Cập nhật:** 14/11/2026 (Buổi 7)
- **Áp dụng cho:** cả 3 thành viên, từ Sprint 1
- **Liên quan:** [CONFIG.md](CONFIG.md) (SemVer, tag, thay đổi) · [TEAM.md](TEAM.md) (người duyệt)

## 1. Mô hình nhánh

Nhóm dùng mô hình **nhánh tính năng ngắn hạn** trên một nhánh chính.

| Nhánh | Vai trò | Ai được ghi |
| --- | --- | --- |
| `hw1` | **Nhánh mặc định, luôn chạy được.** Mọi PR merge vào đây; CI chạy trên mỗi push/PR; tag phát hành gắn trên nhánh này | Chỉ qua Pull Request đã được duyệt |
| `main` | Nhánh cũ dùng cho bài tập trước, **không nhận code mới** | Không ai |
| `<loại>/<mô-tả>` | Nhánh làm việc cho một Issue, tạo từ `hw1`, xóa sau khi merge | Người được giao Issue |

Gợi ý: sau này có thể đổi tên `hw1` thành `main` trong *Settings → Branches*. Việc này cần CCB quyết định vì CI và script triển khai đang dùng tên `hw1`.

### 1.1. Đặt tên nhánh

Dạng `<loại>/<id-pbi>-<mô-tả-ngắn>`, chữ thường, không dấu, nối bằng gạch ngang.

| Loại | Dùng cho | Ví dụ |
| --- | --- | --- |
| `feat/` | Tính năng mới | `feat/s1-04-mobile-checkout` |
| `fix/` | Sửa lỗi | `fix/s1-02-cart-total-360px` |
| `docs/` | Tài liệu | `docs/config-stakeholders` |
| `test/` | Thêm, sửa kiểm thử | `test/s1-02-manual-cases` |
| `chore/` | CI, cấu hình, phụ thuộc | `chore/s1-01-branch-protection` |
| `ops/` | Triển khai, sao lưu | `ops/s1-06-vps-auto-backup` |
| `hotfix/` | Sửa gấp bản demo đang chạy | `hotfix/login-500` |

## 2. Commit

Theo **Conventional Commits**: `<loại>: <mô tả ngắn>`. Loại giống tên nhánh: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`.

```text
feat: thêm nút "Về đơn mới nhất" cho chủ quán
fix: giỏ hàng tràn chữ ở màn hình 360px
docs: cập nhật bảng mốc v0.8.1
```

- Mỗi commit làm một việc, mô tả bằng tiếng Việt hoặc tiếng Anh, không dùng tên chung như “update 3”.
- Không commit `.env`, mật khẩu, khóa API, `node_modules/`, file build, file `.DS_Store`.

## 3. Quy trình làm một việc

```sh
git checkout hw1 && git pull                 # 1. lấy bản mới nhất
git checkout -b feat/s1-04-mobile-checkout   # 2. tạo nhánh cho Issue
# … sửa code, chạy lint/build/test …
git add -p && git commit -m "fix: ..."       # 3. commit nhỏ, rõ ràng
git pull --rebase origin hw1                 # 4. cập nhật trước khi mở PR
git push -u origin feat/s1-04-mobile-checkout
# 5. mở Pull Request vào hw1 trên GitHub
```

## 4. Pull Request

### 4.1. Quy tắc

| Quy tắc | Chi tiết |
| --- | --- |
| Đích | Luôn là `hw1` |
| Kích thước | Nhỏ, một Issue một PR; nên dưới khoảng 400 dòng thay đổi (không tính lockfile) |
| Tiêu đề | Theo Conventional Commits, có ID PBI: `fix(s1-04): sửa tràn chữ ở checkout` |
| Liên kết | Mô tả có `Closes #<số Issue>` |
| Người duyệt | Người **A** của mảng theo [TEAM.md](TEAM.md#2-bảng-raci); tác giả không tự duyệt PR của mình |
| Điều kiện merge | CI pass, ít nhất 1 approve, đã trả lời hết bình luận |
| Thời gian review | Trong 24 giờ kể từ khi PR được mở |
| Cách merge | **Create a merge commit** để giữ lịch sử và để tag luôn nằm trên `hw1` |
| Sau khi merge | Xóa nhánh làm việc; chuyển Issue sang cột Done |

### 4.2. Mẫu mô tả PR

```markdown
## Thay đổi
- …

## Liên quan
Closes #…

## Kiểm tra đã chạy
- [ ] `npm --prefix frontend run lint` / `run build`
- [ ] `npm --prefix backend run lint` / `test` / `run build`
- [ ] Thử trên trình duyệt (ghi trang và kích thước màn hình)

## Ảnh chụp (nếu đổi giao diện)

## Giới hạn còn lại
```

### 4.3. Người review kiểm tra gì

1. Đúng phạm vi Issue, không lẫn thay đổi khác.
2. Không có bí mật hoặc dữ liệu cá nhân trong diff.
3. Thay đổi CSDL có migration mới, không sửa migration cũ.
4. Có kiểm thử hoặc ghi rõ lý do chưa có.
5. Tài liệu liên quan đã được cập nhật.

## 5. Bảo vệ nhánh `hw1`

Cấu hình trong *Settings → Branches → Branch protection rules* (việc S1-01):

- Bắt buộc Pull Request trước khi merge, tối thiểu **1 approve**
- Bắt buộc các job CI `frontend`, `backend`, `mysql-integration`, `deployment-tooling` pass
- Cấm force push và cấm xóa nhánh

## 6. Tag phát hành

- Chỉ Nguyễn Nam Khánh (quản lý phát hành) tạo tag, trên commit đã merge vào `hw1`, theo [CONFIG.md §4](CONFIG.md#4-điểm-mốc-baseline).
- Tên `vX.Y.Z` (SemVer), annotated tag, kèm GitHub Release.
- Tag hiện tại: [`v0.8.0`](https://github.com/Namkhasnh/cse3045-nhom-3/releases/tag/v0.8.0), mốc đầu Sprint 1.

## 7. Xử lý tình huống

| Tình huống | Cách làm |
| --- | --- |
| Xung đột khi `pull --rebase` | Sửa file xung đột → `git add` → `git rebase --continue`; không chắc thì hỏi tác giả phần code kia |
| Lỡ commit bí mật | Báo Khánh ngay để thu hồi khóa; xóa khỏi nhánh **trước khi** merge; khóa đã lộ coi như hỏng |
| Bản demo hỏng sau merge | Tạo `hotfix/…` từ `hw1`, PR ưu tiên review ngay; hoặc triển khai lại tag trước |
| Cần bỏ một PR đã merge | Dùng nút *Revert* trên GitHub để tạo PR đảo ngược; không force push |
