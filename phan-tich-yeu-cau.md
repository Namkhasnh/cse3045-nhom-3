# Phân tích yêu cầu — Website đặt đồ ăn tại Hòa Lạc

## 1. Mục tiêu và phạm vi dự án

Xây dựng website vận hành thực tế, giúp **sinh viên các trường ở Hòa Lạc tìm món, nhận gợi ý và đặt đồ ăn từ các quán đối tác**.

Ba nhóm người dùng: **sinh viên, chủ quán và quản trị viên (admin)**.

Phạm vi sản phẩm hoàn chỉnh:

- Quán tự tổ chức giao hàng; khách nhập địa chỉ hoặc ghim điểm nhận trên bản đồ.
- Website xác định khoảng cách đường đi, khả năng giao và phí theo chính sách từng quán.
- Khách thanh toán bằng tiền mặt hoặc QR trực tiếp cho quán; quán xác nhận đã nhận tiền.
- Hoa hồng tính theo phần trăm **tiền món của đơn hoàn thành**, không gồm phí giao.
- Chủ quán và admin có bảng theo dõi, đối soát hoa hồng; việc thu hoa hồng thực hiện thủ công.
- Có AI gợi ý món, chọn món ngẫu nhiên và **CRUD món ăn, quán ăn**.

**MoSCoW áp dụng cho toàn bộ dự án. MVP là một mốc triển khai riêng, không đồng nghĩa với toàn bộ các chức năng Must.**

## 2. User story và MoSCoW

**Must:** bắt buộc cho sản phẩm hoàn chỉnh. **Should:** quan trọng nhưng có thể hoãn. **Could:** bổ sung khi còn nguồn lực. **Won’t:** ngoài phạm vi dự án hiện tại.

| Mã | User story | Ưu tiên |
|---|---|---|
| US01 | Là **sinh viên**, tôi muốn đăng ký, đăng nhập và quản lý thông tin liên hệ, để đặt và theo dõi các đơn của mình. | Must |
| US02 | Là **sinh viên**, tôi muốn tìm quán và món theo tên, loại món, khoảng giá, để chọn được đồ ăn phù hợp. | Must |
| US03 | Là **sinh viên**, tôi muốn xem thực đơn, giá, giờ bán và tình trạng món, để biết mình có thể đặt gì. | Must |
| US04 | Là **sinh viên**, tôi muốn nhập địa chỉ hoặc ghim điểm nhận và xem khoảng cách, khả năng giao, phí giao, để chọn quán phục vụ được đến chỗ mình. | Must |
| US05 | Là **sinh viên**, tôi muốn thêm món của một quán vào giỏ, chỉnh số lượng và xem tổng tiền trước khi đặt, để đặt đúng món và biết số tiền phải trả. | Must |
| US06 | Là **sinh viên**, tôi muốn chọn trả tiền mặt hoặc chuyển khoản bằng QR của quán, để thanh toán thuận tiện. | Must |
| US07 | Là **sinh viên**, tôi muốn theo dõi trạng thái và hủy đơn khi quán chưa xác nhận, để chủ động với kế hoạch ăn uống. | Must |
| US08 | Là **sinh viên**, tôi muốn AI gợi ý món theo ngân sách, sở thích và điểm nhận, để giảm thời gian lựa chọn. | Must |
| US09 | Là **sinh viên**, tôi muốn chọn ngẫu nhiên một món đáp ứng điều kiện đặt hàng, để quyết định nhanh khi phân vân. | Should |
| US10 | Là **sinh viên**, tôi muốn xem lịch sử đơn và đặt lại, để tiết kiệm thao tác. | Should |
| **US11** | Là **chủ quán**, tôi muốn **thêm, xem, sửa và xóa món ăn trong thực đơn của quán mình**, để quản lý danh sách món đang kinh doanh. | **Must** |
| US12 | Là **chủ quán**, tôi muốn cập nhật thông tin quán, giờ bán, trạng thái nhận đơn, phạm vi giao và mức phí, để khách biết đúng điều kiện phục vụ. | Must |
| US13 | Là **chủ quán**, tôi muốn tiếp nhận, chấp nhận hoặc từ chối đơn kèm lý do và cập nhật tiến độ, để tổ chức xử lý và giao hàng. | Must |
| US14 | Là **chủ quán**, tôi muốn cấu hình QR nhận tiền và xác nhận thanh toán sau khi kiểm tra giao dịch, để theo dõi đúng khoản khách đã trả. | Must |
| US15 | Là **chủ quán**, tôi muốn xem đơn hoàn thành, doanh thu tiền món và hoa hồng theo từng kỳ, để kiểm tra khoản phải trả cho nền tảng. | Must |
| **US16** | Là **admin**, tôi muốn **thêm, xem, sửa và xóa quán ăn**, đồng thời quản lý tài khoản chủ quán phụ trách, để quản lý các đối tác trên nền tảng. | **Must** |
| US17 | Là **admin**, tôi muốn thiết lập tỷ lệ hoa hồng từng quán và có phần xem hoa hồng tổng theo tháng, theo dõi khoản phải thu, đã thu, để thực hiện đối soát. | Must |
| US18 | Là **sinh viên hoặc chủ quán**, tôi muốn gửi yêu cầu hỗ trợ gắn với đơn hàng, để nhóm vận hành có thông tin xử lý vấn đề. | Should |
| US19 | Là **sinh viên**, tôi muốn đánh giá quán sau đơn hoàn thành, để chia sẻ trải nghiệm. | Could |
| US20 | Là **sinh viên**, tôi muốn lưu món hoặc quán yêu thích, để tìm lại nhanh. | Could |
| US21 | Là **người giao hàng**, tôi muốn hệ thống tự phân công đơn và tối ưu lộ trình, để giao hàng hiệu quả. | Won’t |
| US22 | Là **admin**, tôi muốn hệ thống tự chia tiền thanh toán và thu hoa hồng, để giảm thao tác tài chính thủ công. | Won’t |

US21 nằm ngoài phạm vi vì quán tự giao. US22 nằm ngoài phạm vi vì khách trả trực tiếp cho quán; nền tảng chỉ tính, theo dõi và đối soát hoa hồng.

## 3. Yêu cầu chức năng và phi chức năng

### 3.1. Yêu cầu chức năng

| Mã | Chức năng | Nội dung |
|---|---|---|
| FR01 | Tài khoản và phân quyền | Sinh viên quản lý tài khoản của mình; chủ quán quản lý dữ liệu quán mình; admin quản lý đối tác và vận hành. |
| FR02 | Tìm kiếm và xem thực đơn | Xem, tìm kiếm, lọc quán và món; hiển thị giá, giờ bán và tình trạng phục vụ. |
| FR03 | Địa điểm và phí giao | Xác định điểm nhận, khoảng cách đường đi, phạm vi giao và phí theo chính sách từng quán. |
| FR04 | Giỏ hàng và đơn hàng | Quản lý giỏ, tính tổng tiền, đặt, tiếp nhận, theo dõi và hủy đơn theo quy tắc trạng thái. |
| FR05 | Thanh toán | Chọn tiền mặt hoặc QR; chủ quán xác nhận đã nhận tiền. |
| FR06 | Gợi ý món | AI gợi ý và chọn ngẫu nhiên từ các món đáp ứng điều kiện đặt hàng. |
| **FR07** | **CRUD món ăn** | **Chủ quán thêm, xem, sửa, xóa hoặc ngừng bán món thuộc quán mình.** |
| **FR08** | **CRUD quán ăn** | **Admin thêm, xem, sửa, xóa hoặc ngừng hoạt động quán; chủ quán chỉ cập nhật thông tin vận hành của quán mình.** |
| FR09 | Hoa hồng và đối soát | Tính hoa hồng theo đơn hoàn thành; tổng hợp theo quán, kỳ và trạng thái đã thu/chưa thu. |
| FR10 | Tiện ích và hỗ trợ | Lịch sử, đặt lại, hỗ trợ đơn hàng; đánh giá và yêu thích theo mức ưu tiên. |

**Đặc tả CRUD món ăn và quán ăn**

| Thao tác | Món ăn — chủ quán thực hiện | Quán ăn — admin thực hiện |
|---|---|---|
| **Create — Thêm** | Thêm tên món, mô tả, giá, ảnh tùy chọn, loại món và trạng thái phục vụ. | Thêm quán đối tác với tên, địa chỉ/vị trí, liên hệ và tài khoản chủ quán phụ trách. |
| **Read — Xem** | Xem danh sách và chi tiết món, bao gồm món đang bán, hết hàng và đã ẩn. | Xem danh sách, chi tiết và trạng thái hoạt động của các quán. |
| **Update — Sửa** | Sửa thông tin, giá, ảnh và tình trạng món. | Sửa thông tin đối tác, tài khoản phụ trách và trạng thái hoạt động. |
| **Delete — Xóa** | Xóa món chưa từng xuất hiện trong đơn hàng; món đã có giao dịch được ẩn/ngừng bán. | Xóa quán chưa có đơn hàng hoặc đối soát; quán có lịch sử được chuyển sang ngừng hoạt động và giữ dữ liệu. |

Các giới hạn CRUD:

- Chủ quán không được sửa hoặc xóa món của quán khác, không được tự tạo hay xóa quán đối tác.
- Món đã ẩn và quán ngừng hoạt động không nhận đơn mới.
- Ngừng hoạt động quán không tự hủy các đơn đang xử lý hoặc xóa khoản hoa hồng còn phải đối soát.
- Xóa quán chưa có giao dịch đồng thời xử lý thực đơn liên quan và thu hồi quyền quản lý quán đó.
- Giao diện yêu cầu xác nhận trước thao tác xóa; phân biệt rõ **xóa** với **ẩn/ngừng hoạt động**.

**Các quy tắc nghiệp vụ chung**

1. Một đơn thuộc một quán. Tổng tiền khách trả bằng tiền món cộng phí giao.
2. Hoa hồng bằng tiền món của đơn hoàn thành nhân tỷ lệ áp dụng cho đơn; đơn hủy hoặc bị từ chối không phát sinh hoa hồng.
3. Giá, phí giao và tỷ lệ hoa hồng được lưu theo đơn. Sửa món, quán hoặc chính sách sau đó không thay đổi dữ liệu đã chốt.
4. Khoảng cách là khoảng cách đường đi; phạm vi và phí giao do từng quán thiết lập. Chưa xác định được phí thì chưa cho xác nhận đơn.
5. Quét QR hoặc khách báo đã chuyển khoản chưa được coi là thanh toán thành công; quán phải kiểm tra và xác nhận.
6. Sinh viên tự hủy khi đơn còn chờ xác nhận; sau đó gửi yêu cầu hỗ trợ. Hoàn tiền chuyển khoản do quán thực hiện trực tiếp và ghi nhận kết quả.
7. AI và chọn ngẫu nhiên chỉ đưa ra món có thật, còn phục vụ và giao được đến điểm nhận.
8. Đặt lại phải kiểm tra giá, tình trạng món và phí giao hiện tại.

### 3.2. Yêu cầu phi chức năng

Các ngưỡng sau là mục tiêu nghiệm thu đề xuất, cần đo khi xây dựng.

| Mã | Thuộc tính | Tiêu chí kiểm tra |
|---|---|---|
| NFR01 | Hiệu năng | Ít nhất 95% lượt tải danh sách quán/món hoàn tất trong 2 giây với 50 người dùng đồng thời, trong môi trường thử nghiệm được ghi rõ. |
| NFR02 | Phản hồi AI | Ít nhất 95% yêu cầu có kết quả trong 5 giây; quá 10 giây thì báo thử lại và vẫn cho đặt món thủ công. |
| NFR03 | Bảo mật | Dùng HTTPS, băm mật khẩu, giữ kín khóa dịch vụ; kiểm tra quyền truy cập và quyền sở hữu dữ liệu tại máy chủ. |
| NFR04 | Tính đúng đắn | Kiểm tra lại giá, món và phí trước khi tạo đơn; hoa hồng khớp tỷ lệ và dữ liệu đã lưu theo đơn. |
| NFR05 | Độ tin cậy | Gửi lặp cùng yêu cầu không tạo đơn hoặc hoa hồng trùng; đơn đã báo thành công vẫn tồn tại sau khi tải lại trang. |
| NFR06 | Dễ sử dụng | Luồng xem món, chọn điểm nhận, đặt và theo dõi đơn dùng được trên màn hình rộng 360 px, không phải cuộn ngang. |
| NFR07 | Truy vết | Lưu người thực hiện, thời điểm và nội dung khi thay đổi món/quán, xác nhận thanh toán hoặc điều chỉnh hoa hồng. |
| NFR08 | Khôi phục | Sao lưu dữ liệu hằng ngày; kiểm tra khôi phục thành công trước khi vận hành thật. |

## 4. MVP, lộ trình và nghiệm thu

**MVP thử nghiệm tại VJU**

- Một số quán đối tác, điểm nhận cố định và phí giao đã khảo sát.
- Xem món, giỏ hàng, đặt đơn, quán tiếp nhận và cập nhật trạng thái.
- Chủ quán CRUD món; admin CRUD quán ở mức cơ bản, tuân thủ quy tắc bảo toàn lịch sử.
- Thanh toán tiền mặt, AI gợi ý và đối soát hoa hồng thủ công.

**Sản phẩm hoàn chỉnh**

Hoàn thành toàn bộ Must, mở rộng đến các trường trong khu vực phục vụ; bổ sung địa chỉ/ghim bản đồ, khoảng cách đường đi, QR và bảng hoa hồng cho quán/admin. Tiếp tục các Should, ưu tiên chọn món ngẫu nhiên, lịch sử/đặt lại và hỗ trợ.

**Tình huống nghiệm thu chính**

1. Chủ quán thêm món, sửa giá và xem được kết quả; không thể sửa món thuộc quán khác.
2. Xóa được món chưa có giao dịch; món đã có đơn chỉ ngừng bán, lịch sử giữ nguyên tên và giá đã đặt.
3. Admin tạo, sửa và ngừng hoạt động quán; quán ngừng hoạt động không nhận đơn mới nhưng vẫn giữ đơn cũ và đối soát.
4. Đặt hàng hợp lệ tạo đúng đơn và tổng tiền; món hết, quán đóng cửa hoặc điểm ngoài phạm vi không tạo đơn không hợp lệ.
5. QR chỉ chuyển sang đã thanh toán sau khi quán xác nhận.
6. Đơn hoàn thành phát sinh đúng hoa hồng, loại phí giao khỏi cơ sở tính; sửa tỷ lệ không thay đổi đơn cũ.
7. AI hoặc bản đồ lỗi có thông báo phù hợp, không bịa món, khoảng cách hoặc phí giao.
8. Sinh viên và chủ quán không truy cập được đơn hoặc dữ liệu tài chính của người khác.

Tài liệu này làm đầu vào cho phần thiết kế hệ thống và WBS; chưa lựa chọn công nghệ, endpoint hay cấu trúc CSDL.
