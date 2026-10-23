export const statusLabel=(s:string)=>({pending:'Chờ quán nhận',accepted:'Đã nhận đơn',delivering:'Đang giao',completed:'Đã hoàn thành',cancelled:'Khách đã hủy',rejected:'Quán đã từ chối'}[s]??s)
export const orderTime=(value:string)=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})

export const paymentStatusLabel=(s:string|undefined)=>({paid:'Đã thu tiền',unpaid:'Chưa thu tiền',refund_pending:'Cần hoàn tiền',refunded:'Đã hoàn tiền'} as Record<string,string>)[s??'']??'Chưa có bản ghi thu tiền'
