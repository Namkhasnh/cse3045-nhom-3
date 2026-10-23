# HLF Backup OAuth branding — draft for review

Status: **adapted into published static notices on October23; source text below retained as drafting basis**. Scope: operator-only Google Drive backup tool, [setup](google-drive-backup-setup.md); not the ordering website's commercial privacy policy or DEC-12 approval. Prepared from the user's Branding screenshot: homepage/privacy links empty, developer contact populated, logo optional to initial preparation. User subsequently authorized GitHub Pages for these notices only. Repository/host ownership was confirmed through authenticated GitHub admin access; this is not Google domain verification. Existing Google Branding app name/support email were observed, not altered. No V0.9 production/VPS deployment authorized or performed.

Google's [OAuth policy](https://developers.google.com/identity/protocols/oauth2/policies) and [branding requirements](https://support.google.com/cloud/answer/13464321) require accurate app identity and disclosures. Do not use Google's/rclone's homepage or an unrelated privacy page as this application's own policy. Actual Console validation determines the remaining mandatory fields.

## Proposed homepage content — Vietnamese

# HLF Backup

HLF Backup là công cụ sao lưu do người vận hành dự án sử dụng với tài khoản Google Drive của mình. Công cụ không cung cấp dịch vụ đăng nhập hoặc sao lưu cho công chúng.

Trong giai đoạn chuẩn bị hiện tại, người vận hành đã thử mã hóa một file giả lập, tải lên Google Drive, tải xuống và giải mã để đối chiếu. Chưa triển khai lịch backup tự động trên VPS hoặc sao lưu database thật bằng cấu hình này.

Ứng dụng sử dụng quyền Google Drive `drive.file` để tạo và quản lý các file/thư mục được cấp quyền cho ứng dụng. Các file khác trong Drive không thuộc phạm vi truy cập toàn bộ của ứng dụng. Nội dung backup thử được mã hóa trước khi tải lên; khóa giải mã được giữ riêng bởi người vận hành.

Liên hệ qua thông tin hỗ trợ của HLF Backup trên màn hình cấp quyền Google. Trang này cần liên kết đến chính sách quyền riêng tư của HLF Backup sau khi cả hai trang đã được xuất bản tại địa chỉ được kiểm soát bởi người vận hành.

## Proposed privacy notice content — Vietnamese

# Quyền riêng tư — HLF Backup

HLF Backup là công cụ cá nhân của người vận hành, dùng Google Drive làm nơi lưu bản backup đã mã hóa. Thông báo này dành riêng cho công cụ backup; không thay thế chính sách của website đặt món hoặc của Google.

**Phạm vi truy cập.** Công cụ yêu cầu quyền `drive.file`, dùng để tạo, tải lên, tải xuống và quản lý file/thư mục mà ứng dụng được cấp quyền truy cập. Công cụ có thể đọc metadata của các file đó, như tên, kích thước và mã định danh, để thực hiện việc truyền và kiểm tra file. Công cụ không yêu cầu quyền đọc toàn bộ Drive, Gmail hoặc Google Photos.

**Mục đích sử dụng.** Dữ liệu và quyền truy cập chỉ được sử dụng để lưu, lấy lại và kiểm tra backup. Không dùng dữ liệu Drive cho quảng cáo hoặc AI. Thử nghiệm hiện tại sử dụng một file giả lập; chưa sao lưu database thật hoặc vận hành lịch tự động bằng cấu hình này.

**Lưu trữ và khóa.** File thử được mã hóa trên máy người vận hành trước khi gửi tới Google Drive. Khóa giải mã được giữ riêng, không tải lên cùng file backup. Cấu hình rclone chứa thông tin cấp quyền cần thiết cho kết nối Google; người vận hành có trách nhiệm bảo vệ cấu hình và khóa. Việc Google lưu trữ/xử lý dữ liệu tuân theo chính sách và dịch vụ của Google; thông báo này không thay thế chúng.

**Chia sẻ.** Quy trình backup không chủ động công khai hoặc chia sẻ file backup với người khác. Google là nhà cung cấp nơi lưu trữ. Việc cấp quyền hoặc chia sẻ do người vận hành thay đổi ngoài quy trình này phải được xem xét riêng.

**Thời gian lưu và xóa.** File giả lập hiện được giữ để kiểm tra recovery; chưa bật job tự động xóa. Chính sách giữ bản ngày/tuần cho dữ liệu vận hành chưa được triển khai/nghiệm thu. Người vận hành có thể chủ động quản lý các file thuộc ứng dụng và thu hồi quyền của ứng dụng trong tài khoản Google. Thu hồi quyền không tự xóa những file đã lưu và không thay thế nghĩa vụ lưu lịch sử nghiệp vụ nếu sau này có dữ liệu thật.

**Liên hệ và thay đổi.** Liên hệ người vận hành qua thông tin hỗ trợ hiển thị trên màn hình đồng ý Google. Thông báo cần được cập nhật, xem xét trước khi thay đổi mục đích/quyền, đưa dữ liệu thật vào backup hoặc mở công cụ cho người dùng khác.

## Before publishing or entering URLs

1. Operator reviews the text against actual settings; confirm app name/support email in Branding and only drive.file in Data Access. This draft does not attest installed credential scope or legal compliance.
2. Select an existing controlled public host or a separately authorized free static host; no new paid domain/billing. Domain/subdomain verification and publishing permissions must be established. Do not change existing sv26 deployment under current read-only authorization.
3. Produce two reachable HTTPS pages with an actual homepage-to-privacy link. Use their real URLs in Branding. Authorized domains must correspond to the selected controlled host; do not enter domains owned by Google/rclone/the school without required authority.
4. Required URL/contact details and any optional terms remain to confirm. The ordering platform's partnership/consent/payment/privacy policies are not replaced or approved by this notice.
5. Inspect Console validation, save accurate branding, then review the OAuth publishing action. OAuth publishing is separate from V0.9 deployment; no automatic website release or broadened Drive scope. Resolve exposed-secret replacement before unattended use and reauthorize as required by token status.

[Publication receipt](evidence/p29-backup-pages-publication.json): [homepage](https://namkhasnh.github.io/hlf-backup-info/) and [privacy](https://namkhasnh.github.io/hlf-backup-info/privacy.html), GitHub build/deploy success and HTTP200/TLS/hash/browser evidence. Public files in [local static source](../ops/hlf-backup-pages/index.html) adapt the draft and use public repository support instead of publishing private emails. No Google OAuth status, Drive file, VPS or real data changed. P29 and V0.9 remain BLOCKED until their actual gates are met.
