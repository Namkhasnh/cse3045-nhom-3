import {RequestError,requestMessage} from '../../shared/api/request'
export function financeMessage(error:unknown){
 if(error instanceof RequestError){const messages:Record<string,string>={COLLECTION_EXCEEDS_OUTSTANDING:'Số tiền vượt dư nợ được thu sau bù trừ. Chưa ghi thu; hãy cập nhật công nợ và kiểm tra lại.',PERIOD_ALREADY_FINALIZED:'Tháng này đã có bảng đối soát. Hãy mở bảng đã chốt.',ELIGIBLE_ENTRIES_CHANGED:'Danh sách khoản đủ điều kiện đã thay đổi. Hãy cập nhật và xác nhận lại toàn bộ kỳ.',ENTRY_ALREADY_ASSIGNED:'Một số khoản đã thuộc bảng khác. Chưa chốt thêm bảng; hãy cập nhật sổ.',RECEIPT_ALREADY_REVERSED:'Biên nhận đã được đảo hoặc đã có bản thay thế. Hãy kiểm tra chuỗi lịch sử.',COLLECTION_REFERENCE_REUSED:'Mã giao dịch này đã có biên nhận hiệu lực. Hãy kiểm tra khoản đã ghi trước khi lập mới.'};if(messages[error.code])return messages[error.code]}
 return requestMessage(error)
}
