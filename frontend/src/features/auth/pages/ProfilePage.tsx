import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { authApi, ApiError, type User } from '../api/auth.api'
import { Icon } from '../../../shared/ui/Icon'
import { initials } from '../../../shared/lib/initials'
import './profile.css'

export function ProfilePage({ user, onUpdate, onLogout }: {
  user: User; onUpdate: (value: User) => void; onLogout: () => void
}) {
  const [displayName, setDisplayName] = useState(user.display_name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [failed, setFailed] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const form = useRef<HTMLFormElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !user.is_active) return
    const invalid = { name: !displayName.trim() || [...displayName].length > 200 ? 'Nhập họ và tên từ 1 đến 200 ký tự.' : undefined,
      phone: phone.trim() && !/^\+?[0-9]{9,15}$/.test(phone.trim()) ? 'Điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.' : undefined }
    setErrors(invalid)
    if (invalid.name || invalid.phone) { form.current?.querySelector<HTMLInputElement>(invalid.name ? '#profile-name' : '#profile-phone')?.focus(); return }
    setBusy(true)
    setNotice('')
    setFailed(false)
    try {
      const updated = await authApi.profile({ expected_version: user.version, display_name: displayName,
        phone: phone.trim() || null })
      onUpdate(updated)
      setNotice('Đã lưu thông tin.')
    } catch (cause) {
      setFailed(true)
      if (cause instanceof ApiError && cause.code === 'VERSION_CONFLICT') {
        setNotice('Thông tin đã thay đổi ở nơi khác. Tải lại trang trước khi lưu.')
      } else if (cause instanceof ApiError && (cause.status === 401 || cause.code === 'ACCOUNT_INACTIVE')) {
        onLogout()
      } else setNotice('Không lưu được thông tin. Vui lòng thử lại.')
    } finally { setBusy(false) }
  }

  async function logout() {
    if (busy) return
    setBusy(true)
    setNotice('')
    try { await authApi.logout(); onLogout() }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onLogout()
      else { setFailed(true); setNotice('Không thể đăng xuất. Vui lòng thử lại.') }
    } finally { setBusy(false) }
  }

  return <section className="personal-profile" aria-labelledby="profile-title">
    <header className="workspace-page-heading"><span className="workspace-eyebrow">Không gian cá nhân</span><h1 id="profile-title">Tài khoản của tôi</h1><p>Quản lý thông tin cá nhân và hoạt động của bạn.</p></header>
    <div className="personal-profile-grid">
      <aside className="workspace-card identity-card" aria-label="Thông tin tài khoản">
        <div className="profile-avatar" aria-hidden="true">{initials(user.display_name)}</div>
        <span className="profile-role">{user.capabilities.includes('admin') ? 'Quản trị viên' : user.managed_restaurant_id ? 'Chủ quán' : 'Người dùng'}</span>
        <h2>{user.display_name}</h2><p>@{user.login_identifier}</p>
        <div className="identity-meta"><span>Email đăng nhập</span><strong>{user.email ?? 'Chưa có email'}</strong></div>
        <p className={`identity-note${user.email_verified ? ' identity-note--verified' : ''}`}><Icon name={user.email_verified ? 'check' : 'info'} />{user.email_verified ? 'Email đã được xác thực' : 'Email chưa được xác thực'}</p>
        <Button variant="neutral" onClick={logout} disabled={busy}><Icon name="logout" />Đăng xuất</Button>
      </aside>
      <div className="workspace-card personal-profile-card">
        <div className="workspace-card-title"><div><h2>Thông tin cá nhân</h2><p>Cập nhật thông tin hiển thị khi đặt món.</p></div><span><Icon name="user" /></span></div>
        <form ref={form} noValidate onSubmit={submit} aria-busy={busy}>
          <div className="profile-readonly"><div><span>Tên đăng nhập</span><strong>{user.login_identifier}</strong></div><div><span>Email</span><strong>{user.email ?? 'Chưa có email'}</strong></div></div>
      <Input id="profile-name" label="Họ và tên" value={displayName} onChange={event => setDisplayName(event.target.value)}
        autoComplete="name" maxLength={200} required disabled={busy || !user.is_active} error={errors.name} aria-describedby="profile-name-hint" />
      <p className="profile-field-hint" id="profile-name-hint">Tên này được dùng cho các đơn hàng của bạn.</p>
      <Input id="profile-phone" label="Số điện thoại" value={phone} onChange={event => setPhone(event.target.value)}
        type="tel" autoComplete="tel" maxLength={16} disabled={busy || !user.is_active} error={errors.phone} aria-describedby="profile-phone-hint" />
      <p className="profile-field-hint" id="profile-phone-hint">Dùng để quán liên hệ khi cần hỗ trợ đơn hàng.</p>
      {notice && <p className={`profile-feedback${failed ? ' profile-feedback--error' : ''}`} role={failed ? 'alert' : 'status'}><Icon name={failed ? 'alert' : 'check'} />{notice}</p>}
      <div className="profile-form-actions"><p>Email và tên đăng nhập không thể chỉnh sửa.</p><Button type="submit" disabled={busy||!user.is_active}>{busy ? 'Đang xử lý…' : 'Lưu thay đổi'}</Button></div>
        </form>
    {!user.is_active&&<p role="alert">Tài khoản đang đình chỉ; chỉ xử lý nghĩa vụ cũ.</p>}
      </div>
    </div>
  </section>
}
