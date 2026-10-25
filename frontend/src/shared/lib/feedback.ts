export const feedbackEvent = 'hlf:action-feedback'
export type Feedback = { message: string; tone: 'success' | 'error' }
export type FeedbackNotice = Feedback & {
  title?: string
  duration?: number
  action?: {label: string; run: () => Promise<void>}
  link?: {label: string; href: string}
  onDismiss?: () => void
  returnFocus?: () => void
}
export const feedbackDismissEvent = 'hlf:feedback-dismiss'
let feedbackSequence = 0

// A publisher owns cancellation; the viewport owns presentation and its waiting queue.
export function publishFeedback(notice: FeedbackNotice) {
  const token = ++feedbackSequence
  window.dispatchEvent(new CustomEvent(feedbackEvent, {detail: {...notice, token}}))
  return () => window.dispatchEvent(new CustomEvent(feedbackDismissEvent, {detail: token}))
}

// Transient UI feedback only: no storage, inbox API, telemetry or contact payload.
export function showFeedback(message: string, tone: Feedback['tone'] = 'success') {
  window.dispatchEvent(new CustomEvent<Feedback>(feedbackEvent, { detail: { message, tone } }))
}

export function mutationFeedback(path: string, method: string, data: unknown): string | null {
  const route = path.split('?')[0]
  // Background quote refresh, notification reads and intermediate uploads stay quiet.
  if (method === 'GET' || route === '/orders/preview' || route === '/delivery-quotes' || route.startsWith('/notifications') || /media|uploads/.test(route)) return null
  if (route === '/orders' && method === 'POST') {
    const code = data && typeof data === 'object' && 'order_code' in data ? data.order_code : null
    return typeof code === 'string' && /^HLF-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)
      ? `Bạn đã đặt hàng thành công. Mã đơn ${code}.` : 'Bạn đã đặt hàng thành công.'
  }
  if (/\/food-ready$/.test(route)) return 'Đã đánh dấu xong món – chờ giao.'
  if (/^\/orders\/\d+\/transitions$/.test(route) && data && typeof data === 'object' && 'status' in data) {
    const labels: Record<string,string> = {accepted:'Đã nhận đơn hàng.',delivering:'Đã bắt đầu giao món.',completed:'Đã hoàn thành đơn hàng.',rejected:'Đã từ chối đơn hàng.'}
    return typeof data.status === 'string' ? labels[data.status] ?? 'Đã cập nhật đơn hàng.' : 'Đã cập nhật đơn hàng.'
  }
  if (/\/cancel$/.test(route)) return 'Đã hủy đơn hàng.'
  if (/\/payment\/confirm$/.test(route)) return 'Đã ghi nhận xác nhận thu tiền từ quán.'
  if (route === '/auth/login' || route === '/auth/admin/mfa/verify') {
    if (data && typeof data === 'object' && 'capabilities' in data) return 'Đăng nhập thành công.'
    return null
  }
  if (route === '/auth/logout') return 'Đã đăng xuất.'
  if (route === '/auth/register') return 'Đăng ký thành công. Hãy kiểm tra email để xác minh tài khoản.'
  if (route === '/auth/verify-email') return 'Xác minh email thành công.'
  if (route === '/profile') return 'Đã cập nhật thông tin tài khoản.'
  if (/\/dishes(?:\/\d+)?$/.test(route)) return method === 'DELETE' ? 'Đã cập nhật trạng thái món theo kết quả máy chủ.' : 'Đã lưu món ăn.'
  if (/\/owner\/restaurants\/\d+$/.test(route)) return 'Đã lưu cài đặt quán.'
  return 'Thao tác đã được máy chủ ghi nhận.'
}
