import {Button} from '../../shared/ui/Button'
import type {useAdminCommand} from './use-administration'
export function CommandStatus({command:c}:{command:ReturnType<typeof useAdminCommand>}){
 const p=c.pending?.path??'',ticket=p.match(/\/support\/requests\/([1-9][0-9]*)/),user=p.match(/\/users\/([1-9][0-9]*)/),hold=p.match(/\/data-holds\/([1-9][0-9]*)/),body=c.pending?.body as Record<string,unknown>|undefined
 const target=ticket?'hồ sơ hỗ trợ #'+ticket[1]:user?'tài khoản #'+user[1]:hold?'bằng chứng đang giữ #'+hold[1]:p==='/support/requests'?'đơn #'+String(body?.order_id??''): 'yêu cầu ẩn hồ sơ của bạn'
 return <>{c.error&&<p role="alert">{c.error}</p>}{c.notice&&<p role="status">{c.notice}</p>}{c.pending&&<div role="alert"><p>Kết quả chưa được đối chiếu cho {target}. Giữ nguyên nội dung yêu cầu đã xác nhận để kiểm tra hoặc gửi lại.</p><Button disabled={c.busy} onClick={c.retry}>Kiểm tra / gửi lại yêu cầu cũ</Button></div>}</>
}
