import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { authApi, ApiError, type User } from '../api/auth.api'

export function ProfilePage({ user, onUpdate, onLogout }: {
  user: User; onUpdate: (value: User) => void; onLogout: () => void
}) {
  const [displayName, setDisplayName] = useState(user.display_name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    try {
      const updated = await authApi.profile({ expected_version: user.version, display_name: displayName,
        phone: phone.trim() || null })
      onUpdate(updated)
      setNotice('Đã lưu thông tin.')
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'VERSION_CONFLICT') {
        setNotice('Thông tin đã thay đổi ở nơi khác. Tải lại trang trước khi lưu.')
      } else if (cause instanceof ApiError && (cause.status === 401 || cause.code === 'ACCOUNT_INACTIVE')) {
        onLogout()
      } else setNotice('Không lưu được thông tin. Vui lòng thử lại.')
    } finally { setBusy(false) }
  }

  async function logout() {
    setBusy(true)
    setNotice('')
    try { await authApi.logout(); onLogout() }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onLogout()
      else setNotice('Không thể đăng xuất. Vui lòng thử lại.')
    } finally { setBusy(false) }
  }

  return <section className="profile-panel" aria-labelledby="profile-title">
    <h1 id="profile-title">Tài khoản</h1>
    <p className="profile-hint">Tên đăng nhập: <strong>{user.login_identifier}</strong></p>
    <p className="profile-hint">Email: <strong>{user.email ?? 'Chưa có'}</strong></p>
    <p className="profile-hint">Vai trò hiện tại: <strong>{user.capabilities.includes('admin') ? 'Quản trị viên' :
      user.capabilities.includes('manage_restaurant') ? 'Chủ quán' : 'Người dùng / Sinh viên'}</strong></p>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <form className="auth-form" onSubmit={submit}>
      <Input id="profile-name" label="Họ và tên" value={displayName} onChange={event => setDisplayName(event.target.value)}
        autoComplete="name" maxLength={200} required />
      <Input id="profile-phone" label="Số điện thoại" value={phone} onChange={event => setPhone(event.target.value)}
        autoComplete="tel" maxLength={16} />
      <Button type="submit" disabled={busy}>Lưu thay đổi</Button>
    </form>
    <Button variant="neutral" onClick={logout} disabled={busy}>Đăng xuất</Button>
  </section>
}
