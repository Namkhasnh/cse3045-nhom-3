import {ApiError} from '../api/auth.api'
export function profileIdentityError(error:unknown){
 if(error instanceof ApiError){
  const messages:Record<string,string>={PASSWORD_INVALID:'Mật khẩu hiện tại không đúng.',EMAIL_TAKEN:'Email này đã được sử dụng. Hãy chọn email khác.',EMAIL_UNCHANGED:'Hãy nhập email khác email hiện tại.',EMAIL_CHANGE_CODE_INVALID:'Mã không đúng, hết hạn hoặc đã được thay thế. Kiểm tra mã hoặc gửi lại.',RATE_LIMITED:'Bạn đã thao tác quá nhanh hoặc quá nhiều lần. Hãy chờ rồi thử lại.',VERSION_CONFLICT:'Thông tin đã thay đổi. Tải lại trang trước khi thử lại.',EMAIL_NOT_CONFIGURED:'Dịch vụ email chưa được cấu hình. Email hiện tại vẫn được giữ.',EMAIL_UNAVAILABLE:'Chưa gửi được email. Hãy thử lại; email hiện tại vẫn được giữ.',VALIDATION_ERROR:'Ảnh hoặc thông tin không hợp lệ. Dùng ảnh JPEG/PNG tối đa 5 MB.',TOKEN_INVALID:'Phiên đăng nhập đã kết thúc. Hãy tải lại và đăng nhập.',ACCOUNT_CHANGED:'Tài khoản đã thay đổi. Hãy tải lại trang.'}
  if(messages[error.code])return messages[error.code]
 }
 return 'Chưa hoàn tất yêu cầu. Hãy thử lại; thông tin chỉ đổi sau khi máy chủ xác nhận.'
}
