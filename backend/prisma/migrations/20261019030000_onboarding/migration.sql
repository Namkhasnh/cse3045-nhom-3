CREATE TABLE partnership_terms_versions (
 version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 content_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 content LONGTEXT NOT NULL, published_at DATETIME(3) NOT NULL, effective_at DATETIME(3) NOT NULL,
 UNIQUE KEY terms_version_hash(version,content_hash)
) ENGINE=InnoDB;
CREATE TABLE onboarding_evidence (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, applicant_id BIGINT NOT NULL, uploader_id BIGINT NOT NULL,
 kind ENUM('front_image','business_document') NOT NULL, mime_type VARCHAR(32) NOT NULL,
 content_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, size_bytes INT UNSIGNED NOT NULL,
 object_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), deleted_at DATETIME(3) NULL,
 CONSTRAINT evidence_applicant_fk FOREIGN KEY(applicant_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT evidence_uploader_fk FOREIGN KEY(uploader_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT evidence_size CHECK(size_bytes>0 AND size_bytes<=5242880),
 CONSTRAINT evidence_mime CHECK((kind='front_image' AND mime_type IN('image/jpeg','image/png')) OR (kind='business_document' AND mime_type IN('image/jpeg','image/png','application/pdf'))),
 INDEX evidence_applicant_idx(applicant_id,id)
) ENGINE=InnoDB;
CREATE TABLE restaurant_applications (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, applicant_id BIGINT NOT NULL, proposed_by BIGINT NULL,
 kind ENUM('application','manual') NOT NULL, status ENUM('awaiting_confirmation','submitted','approved','rejected') NOT NULL,
 payload JSON NOT NULL, terms_version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 terms_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, front_image_id BIGINT NOT NULL, business_document_id BIGINT NOT NULL,
 consent_at DATETIME(3) NULL, reviewed_at DATETIME(3) NULL, cooperation_ended_at DATETIME(3) NULL,
 restaurant_id BIGINT NULL UNIQUE, version INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 active_applicant_id BIGINT GENERATED ALWAYS AS (CASE WHEN status IN('awaiting_confirmation','submitted') THEN applicant_id ELSE NULL END) STORED,
 UNIQUE KEY application_pending_unique(active_applicant_id),
 CONSTRAINT application_applicant_fk FOREIGN KEY(applicant_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_proposer_fk FOREIGN KEY(proposed_by) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_terms_fk FOREIGN KEY(terms_version,terms_hash) REFERENCES partnership_terms_versions(version,content_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_front_fk FOREIGN KEY(front_image_id) REFERENCES onboarding_evidence(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_document_fk FOREIGN KEY(business_document_id) REFERENCES onboarding_evidence(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT application_consistency CHECK((status='awaiting_confirmation' AND kind='manual' AND consent_at IS NULL) OR (status<>'awaiting_confirmation' AND consent_at IS NOT NULL)),
 CONSTRAINT application_manual CHECK((kind='manual' AND proposed_by IS NOT NULL) OR(kind='application' AND proposed_by IS NULL)),
 CONSTRAINT application_result CHECK((status='approved' AND restaurant_id IS NOT NULL AND reviewed_at IS NOT NULL) OR(status='rejected' AND restaurant_id IS NULL AND reviewed_at IS NOT NULL) OR(status IN('submitted','awaiting_confirmation') AND restaurant_id IS NULL AND reviewed_at IS NULL)),
 CONSTRAINT application_version CHECK(version BETWEEN 1 AND 2147483647),
 INDEX application_applicant_idx(applicant_id,id), INDEX application_status_idx(status,id)
) ENGINE=InnoDB;
CREATE TABLE application_reviews (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, application_id BIGINT NOT NULL UNIQUE, actor_id BIGINT NOT NULL,
 decision ENUM('approved','rejected') NOT NULL, reason VARCHAR(1000) NULL, restaurant_id BIGINT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT review_application_fk FOREIGN KEY(application_id) REFERENCES restaurant_applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT review_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT review_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT review_reason CHECK((decision='rejected' AND reason IS NOT NULL AND CHAR_LENGTH(TRIM(reason))>0 AND restaurant_id IS NULL) OR(decision='approved' AND reason IS NULL AND restaurant_id IS NOT NULL))
) ENGINE=InnoDB;
CREATE TABLE onboarding_requests (
 actor_id BIGINT NOT NULL, operation VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, result JSON NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY(actor_id,operation,idempotency_key),
 CONSTRAINT onboarding_request_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
INSERT INTO partnership_terms_versions(version,content_hash,content,published_at,effective_at) VALUES ('2026-10-19.v1','52498bc3ba2e3adf2545a4ee28f0a6173469f33b7c9893c274e8e0292ec8be12','ĐIỀU KHOẢN HỢP TÁC HOALACFOOD — 2026-10-19.v1

1. Đăng ký và xét duyệt
Người đăng ký phải có tài khoản đang hoạt động, đã xác minh email và chưa quản lý quán nào, kể cả quán ngừng hoạt động hoặc chưa hoàn tất thiết lập. Mỗi tài khoản chỉ quản lý tối đa một quán và vẫn giữ quyền mua hàng.

2. Thông tin và bằng chứng
Hồ sơ gồm tên quán, địa chỉ, tên người liên hệ, số điện thoại, ảnh mặt tiền và giấy đăng ký hộ kinh doanh/doanh nghiệp. Người đăng ký chịu trách nhiệm về tính chính xác và quyền sử dụng tài liệu. hoalacfood kiểm tra thủ công và có thể từ chối kèm lý do. Không thu CCCD hoặc thông tin tài khoản ngân hàng trong hồ sơ này.

3. Lịch sử hồ sơ
Mỗi tài khoản có tối đa một hồ sơ đang chờ xác nhận hoặc xét duyệt. Hồ sơ đã gửi được giữ nguyên; chưa hỗ trợ sửa, rút hoặc tự hết hạn. Sau khi bị từ chối, người dùng có thể nộp hồ sơ mới. Kết quả và lý do xét duyệt được lưu trong lịch sử.

4. Đồng ý điều khoản
Người đăng ký phải chủ động đồng ý bản điều khoản hiển thị. Hệ thống lưu phiên bản, mã kiểm tra nội dung và thời điểm đồng ý. Hồ sơ chờ duyệt được xét theo bản đã đồng ý. Bản mới không sửa lại lịch sử. Khi Admin tạo quán thủ công, người được chọn phải đăng nhập và xác nhận đúng thông tin quán cùng điều khoản trước khi tạo. V0.3 chưa hỗ trợ chuyển chủ.

5. Điều kiện hoạt động
Duyệt hồ sơ chỉ tạo quán ở trạng thái cần thiết lập, chưa cho phép nhận đơn. Quán chỉ được bán sau khi hoàn tất hồ sơ công khai, thực đơn, giờ hoạt động, phương án giao hàng, phí giao đã xác minh, thanh toán và mức hoa hồng được hai bên đồng ý. Quán tự chịu trách nhiệm chế biến, an toàn thực phẩm và giao hàng.

6. Hoa hồng và trung thực giao dịch
Tỷ lệ được thỏa thuận riêng từng quán từ 3% đến 5%, không vượt quá 5%; không có mức mặc định. Chủ quán phải đồng ý mức cụ thể trước khi bán. Thay đổi tỷ lệ cần đồng ý lại và chỉ áp dụng cho đơn mới. Hoa hồng cơ bản phát sinh khi đơn hoàn thành, tính trên tiền món, không gồm phí giao, làm tròn đến đồng một lần cho mỗi đơn; đơn hoàn thành vẫn phát sinh hoa hồng nếu chưa thu được tiền khách.
Quán không được khai sai trạng thái, ép khách hủy hoặc chuyển giao dịch ra ngoài để né phí. Khi xác minh đơn phát sinh từ hoalacfood đã được giao thực tế, quán vẫn có nghĩa vụ thanh toán hoa hồng đã thỏa thuận. Khoản truy thu phải được thông báo, có bằng chứng, lý do và quyền khiếu nại; lời khai một bên không tự chứng minh giao hàng hoặc thanh toán. Không sửa ngầm đơn đã hủy thành hoàn thành. Cơ chế xác minh và khoản truy thu riêng phải được triển khai, kiểm thử trước khi áp dụng.

7. Thanh toán và hoàn tiền
Khách trả tiền mặt hoặc chuyển QR trực tiếp cho quán; hoalacfood không giữ hoặc chia tiền. Quán xác minh tiền thực nhận; ảnh QR và thông báo đã chuyển không chứng minh thanh toán. Với đơn bị hủy/từ chối khi đang chờ nhận mà quán đã nhận tiền, quán hoàn đủ trực tiếp trong 24 giờ kể từ lúc xác nhận đã nhận tiền và phát sinh nghĩa vụ hoàn. Tiền đến muộn trên đơn đã hủy/từ chối áp dụng cùng quy tắc. Chưa hỗ trợ hoàn một phần.

8. Đối soát
Kỳ đối soát là tháng dương lịch theo giờ Việt Nam. hoalacfood gửi bảng tháng trước chậm nhất ngày 3; quán thanh toán chậm nhất 23:59:59 ngày 7, kể cả cuối tuần/ngày lễ. Sai lệch được ghi điều chỉnh có lý do ở kỳ sau; không sửa/xóa bảng hoặc khoản thu cũ. Giữ số dư âm để bù trừ; chưa thu vượt số còn phải trả. Chậm trả được liên hệ xử lý, chưa tự động phạt hoặc khóa quán.

9. Dữ liệu, hỗ trợ và ngừng hợp tác
Tài liệu xét duyệt chỉ dành cho người nộp và Admin có thẩm quyền; không tự công khai. Tài liệu hồ sơ bị từ chối được lưu 90 ngày từ ngày từ chối; hồ sơ được duyệt lưu trong thời gian hợp tác và một năm sau khi kết thúc. Sau hạn xóa file, giữ lịch sử xét duyệt/đồng ý và dấu vết xóa; không giữ bản sao tài liệu trong nhật ký.
Trong đơn hàng, quán chỉ thấy mã đơn, món, tiền và điểm giao cố định trước mốc đã xong món – chờ giao. Nhận đơn chưa mở tên/số liên hệ. Chỉ thao tác đã xong món – chờ giao mới mở tên và số điện thoại người nhận để tổ chức giao. Không cung cấp ID tài khoản, username hoặc email người đặt cho quán; lọc tại API, kể cả ghi chú. Mốc xong món không tự hoàn thành đơn hoặc phát sinh hoa hồng. Quán chỉ sử dụng thông tin người nhận để thực hiện đơn.
Hỗ trợ/ngừng hợp tác: Zalo 0352689944. Ngừng nhận đơn mới không xóa trách nhiệm xử lý đơn, hoàn tiền và công nợ đã phát sinh. Đình chỉ và tranh chấp chi tiết thuộc chính sách được phê duyệt riêng; không tự động áp dụng.
','2026-10-19 00:00:00.000','2026-10-19 00:00:00.000');
