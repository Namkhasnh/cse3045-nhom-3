import { useEffect, useState } from 'react'
import { authApi, type RoleRequest } from '../api/auth.api'
import { Button } from '../../../shared/ui/Button'

export function RoleRequestsPage() {
  const [items, setItems] = useState<RoleRequest[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    authApi.roleRequests().then(result => { setItems(result); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [])

  async function review(id: string, decision: 'approve' | 'reject') {
    setBusyId(id)
    setError('')
    try {
      await authApi.reviewRoleRequest(id, decision)
      setItems(current => current.filter(item => item.id !== id))
    } catch {
      setError('Không thể duyệt yêu cầu. Hãy tải lại trang để kiểm tra trạng thái mới nhất.')
    } finally { setBusyId(null) }
  }

  return <section aria-labelledby="role-requests-heading">
    <h1 id="role-requests-heading">Yêu cầu cấp quyền</h1>
    <p>Chỉ duyệt sau khi xác nhận người đăng ký có nhiệm vụ tương ứng.</p>
    {status === 'loading' && <p role="status">Đang tải yêu cầu…</p>}
    {status === 'error' && <p role="alert">Không tải được yêu cầu. Hãy tải lại trang.</p>}
    {error && <p role="alert">{error}</p>}
    {status === 'ready' && items.length === 0 && <p>Không có yêu cầu đang chờ.</p>}
    {status === 'ready' && <ul className="role-requests-list">{items.map(item => <li key={item.id}>
      <strong>{item.display_name}</strong> ({item.login_identifier}) — {item.requested_role === 'admin' ? 'Quản trị viên' : 'Chủ quán'}
      <div><Button type="button" aria-label={`Duyệt yêu cầu của ${item.display_name}`} disabled={busyId !== null}
        onClick={() => review(item.id, 'approve')}>Duyệt</Button>{' '}
        <Button type="button" aria-label={`Từ chối yêu cầu của ${item.display_name}`} disabled={busyId !== null}
          onClick={() => review(item.id, 'reject')}>Từ chối</Button></div>
    </li>)}</ul>}
  </section>
}
