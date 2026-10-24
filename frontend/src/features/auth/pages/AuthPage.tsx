import { useState, type FormEvent } from 'react'
import { authPath } from '../return-path'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { authApi, ApiError, type User } from '../api/auth.api'

const errorText: Record<string, string> = {
  INTERNAL_ERROR: 'Máy chủ gặp lỗi khi đăng nhập. Chưa thể mở phiên; hãy thử lại sau hoặc liên hệ hỗ trợ.',
  TEMPORARILY_UNAVAILABLE: 'Dịch vụ đăng nhập đang tạm thời không sẵn sàng. Hãy thử lại sau.',
  REQUEST_TIMEOUT: 'Máy chủ phản hồi quá lâu. Hãy kiểm tra kết nối và đăng nhập lại. Yêu cầu không được tự gửi lại.',
  MFA_INVALID: 'Mã MFA không hợp lệ, đã hết hạn hoặc hết lượt thử. Bạn có thể đăng nhập lại.',
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
  LOGIN_IDENTIFIER_TAKEN: 'Tên đăng nhập đã được sử dụng.',
  VALIDATION_ERROR: 'Vui lòng kiểm tra thông tin đã nhập.',
  RATE_LIMITED: 'Bạn thử lại sau ít phút nhé.',
  PASSWORD_CHECK_UNAVAILABLE: 'Chưa kiểm tra được độ an toàn của mật khẩu. Vui lòng thử lại sau.',
  CSRF_FAILED: 'Địa chỉ trang không khớp cấu hình máy chủ. Hãy mở lại trang bằng đúng địa chỉ Vite.',
  ACCOUNT_TAKEN: 'Tên đăng nhập hoặc email đã được sử dụng.',
  EMAIL_CODE_INVALID: 'Mã xác minh không đúng, đã hết hạn hoặc đã nhập sai quá 5 lần.',
  EMAIL_UNAVAILABLE: 'Chưa gửi được email. Hãy thử gửi lại mã sau.',
  EMAIL_NOT_CONFIGURED: 'Chức năng gửi email chưa sẵn sàng. Vui lòng thử lại sau.',
}

function describeError(error: ApiError) {
  if (error.code === 'VALIDATION_ERROR') {
    if (error.message === 'Invalid login identifier.') return 'Tên đăng nhập cần 3–32 ký tự ASCII: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang. Không dùng email.'
    if (error.message === 'Invalid password.') return 'Mật khẩu cần 12–128 ký tự, không chứa ký tự điều khiển và không được là mật khẩu đã bị lộ.'
    if (error.message === 'Invalid email address.') return 'Email chưa đúng định dạng. Hãy kiểm tra lại địa chỉ nhận mã.'
    if (error.message === 'Invalid contact details.') return 'Hãy nhập họ tên; số điện thoại nếu có phải gồm 9–15 chữ số và có thể bắt đầu bằng +.'
  }
  return errorText[error.code] ?? 'Không thể hoàn tất. Vui lòng thử lại.'
}

export function AuthPage({ mode, onLogin, onNavigate }: {
  mode: 'login' | 'register' | 'verify'; onLogin: (user: User) => void; onNavigate: (path: string) => void
}) {
  const [username, setUsername] = useState(new URLSearchParams(window.location.search).get('username') ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [email, setEmail] = useState('')
  const [challenge, setChallenge] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  function fieldError(id: string, message: string) {
    setFieldErrors({ [id]: message })
    document.getElementById(id)?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setFieldErrors({})
    if (mode === 'register' && password !== passwordConfirmation) {
      setError('Mật khẩu nhập lại chưa khớp.')
      fieldError('password-confirmation', 'Mật khẩu nhập lại chưa khớp.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        await authApi.register({ login_identifier: username, password, display_name: displayName,
          phone: phone.trim() || null, email })
        onNavigate(authPath(`/verify-email?username=${encodeURIComponent(username)}`))
      } else if (mode === 'verify') {
        await authApi.verifyEmail(username, code)
        onNavigate(authPath('/login?verified=1'))
      } else if (challenge) {
        const result = await authApi.verifyMfa(challenge, recoveryMode ? { recovery_code: mfaCode } : { code: mfaCode })
        if ('re_enrollment_required' in result) {
          setChallenge(null); setPassword(''); setMfaCode('')
          setNotice('Mã phục hồi đã được dùng. Phiên cũ đã bị thu hồi. Hãy đăng ký lại TOTP qua CLI operator trước khi đăng nhập Admin.')
        } else onLogin(result)
      } else {
        const result = await authApi.login(username, password)
        setPassword('')
        if ('mfa_required' in result) { setChallenge(result.challenge_id); setMfaCode('') }
        else onLogin(result)
      }
    } catch (cause) {
      if (mode === 'register' && cause instanceof ApiError && cause.code === 'EMAIL_UNAVAILABLE') {
        onNavigate(authPath(`/verify-email?username=${encodeURIComponent(username)}&delivery_failed=1`))
        return
      }
      setError(cause instanceof ApiError ? describeError(cause) :
        'Không kết nối được máy chủ. Vui lòng thử lại.')
      if (cause instanceof ApiError) {
        const field = cause.code === 'MFA_INVALID' ? 'mfa-code'
          : cause.code === 'EMAIL_CODE_INVALID' ? 'email-code'
          : ['LOGIN_IDENTIFIER_TAKEN', 'ACCOUNT_TAKEN'].includes(cause.code) ? 'username'
          : ({ 'Invalid login identifier.': 'username', 'Invalid password.': 'password',
              'Invalid email address.': 'email', 'Invalid contact details.': 'display-name' } as Record<string, string>)[cause.message]
        if (field) fieldError(field, describeError(cause))
        if (cause.code === 'REQUEST_TIMEOUT') { setPassword(''); setMfaCode('') }
      }
    } finally { setBusy(false) }
  }

  const register = mode === 'register'
  const verify = mode === 'verify'
  return <div className={`auth-shell${mode === 'login' ? ' auth-shell--login' : ''}`}>
    {mode === 'login' && <aside className="auth-story" aria-hidden="true">
      <div className="auth-story__top">HÒA LẠC FOOD <span>•</span> VJU</div>
      <div className="auth-story__plate"><span className="auth-story__plate-inner" /></div>
      <div className="auth-story__bottom">
        <p>Một điểm bắt đầu<br />cho bữa ăn quanh VJU.</p>
        <span>Khám phá các quán ăn trong khuôn viên</span>
      </div>
    </aside>}
    <main id="main-content" className={`auth-panel${mode === 'login' ? ' auth-panel--login' : ''}`}>
      <a href="/" className="brand auth-brand" aria-label="Hòa Lạc Food — Trang chủ">Hòa Lạc <span className="text-brand">Food</span></a>
      <h1>{verify ? 'Xác minh email' : register ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
      <p className="auth-intro">{verify ? 'Nhập mã 6 số đã gửi tới email của bạn.' : register ? 'Tạo tài khoản để mua hàng và theo dõi thông tin của bạn.' : 'Chào mừng bạn trở lại. Dùng tên tài khoản để tiếp tục.'}</p>
      {verify && new URLSearchParams(window.location.search).has('delivery_failed') &&
        <p className="form-notice" role="status">Chưa gửi được mã. Hãy thử gửi lại sau ít phút.</p>}
      {new URLSearchParams(window.location.search).has('verified') && !register && !verify &&
        <p className="form-success" role="status">Email đã được xác minh. Hãy đăng nhập.</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {mode==='login'&&<p><a href="/recover-access">Khôi phục truy cập khi thông tin đăng nhập bị lộ</a></p>}<form onSubmit={submit} className="auth-form" onChange={event=>{
        if(event.target instanceof HTMLInputElement){const id=event.target.id;setFieldErrors(current=>{if(!current[id])return current;const next={...current};delete next[id];return next})}
      }}>
        {register && <Input id="display-name" error={fieldErrors['display-name']} label="Họ và tên" autoComplete="name" value={displayName}
          onChange={event => setDisplayName(event.target.value)} maxLength={200} required />}
        <Input id="username" error={fieldErrors['username']} label="Tên đăng nhập" autoComplete="username" value={username}
          onChange={event => setUsername(event.target.value)} minLength={3} maxLength={32} required
          pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}"
          title="3–32 ký tự ASCII: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang; không dùng email" />
        {register && <p className="form-help">Dùng tên đăng nhập 3–32 ký tự, không dùng email.</p>}
        {register && <Input id="email" error={fieldErrors['email']} label="Email" type="email" autoComplete="email" value={email}
          onChange={event => setEmail(event.target.value)} maxLength={254} required />}
        {register && <Input id="phone" error={fieldErrors['phone']} label="Số điện thoại (không bắt buộc)" autoComplete="tel" value={phone}
          onChange={event => setPhone(event.target.value)} maxLength={16} pattern="\+?[0-9]{9,15}"
          title="9–15 chữ số, có thể bắt đầu bằng +" />}
        {!verify && !challenge && <Input id="password" error={fieldErrors['password']} label="Mật khẩu" type="password" autoComplete={register ? 'new-password' : 'current-password'}
          value={password} onChange={event => setPassword(event.target.value)} minLength={register ? 12 : undefined} required />
        }
        {register && <Input id="password-confirmation" error={fieldErrors['password-confirmation']} label="Nhập lại mật khẩu" type="password" autoComplete="new-password"
          value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)}
          minLength={12} required />}
        {register && <p className="form-help">Từ 12 đến 128 ký tự. Không dùng mật khẩu phổ biến.</p>}
        {verify && <Input id="email-code" error={fieldErrors['email-code']} label="Mã xác minh" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} required />}
        {challenge && <>
          <Input id="mfa-code" error={fieldErrors['mfa-code']} label={recoveryMode ? 'Mã phục hồi' : 'Mã Authenticator'} autoFocus
            autoComplete="one-time-code" inputMode={recoveryMode ? 'text' : 'numeric'}
            pattern={recoveryMode ? '[a-f0-9]{32}' : '[0-9]{6}'} maxLength={recoveryMode ? 32 : 6}
            value={mfaCode} onChange={event => setMfaCode(event.target.value)} required />
          <Button type="button" variant="neutral" disabled={busy} onClick={() => { setRecoveryMode(!recoveryMode); setMfaCode(''); setFieldErrors({}); setError('') }}>
            {recoveryMode ? 'Dùng Authenticator' : 'Dùng mã phục hồi'}
          </Button>
          <Button type="button" variant="neutral" disabled={busy} onClick={() => { setChallenge(null); setMfaCode(''); setPassword(''); setFieldErrors({}); setError('') }}>Đăng nhập lại</Button>
        </>}
        <Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : verify ? 'Xác minh email' : register ? 'Tạo tài khoản' : challenge ? 'Xác minh MFA' : 'Đăng nhập'}</Button>
      </form>
      {verify && <Button type="button" disabled={busy} onClick={async () => {
        setBusy(true); setError(''); setNotice(''); setFieldErrors({})
        try { await authApi.resendEmailCode(username); setNotice('Nếu tài khoản chưa xác minh, mã mới đã được gửi.') }
        catch (cause) { setError(cause instanceof ApiError ? describeError(cause) : 'Không kết nối được máy chủ.') }
        finally { setBusy(false) }
      }}>Gửi lại mã</Button>}
      {!register && !verify && <p className="auth-verify-link"><a href={authPath('/verify-email')}>Cần xác minh email? Nhập mã xác minh</a></p>}
      <p className="auth-switch">{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <a href={authPath(register || verify ? '/login' : '/register')}>{register || verify ? 'Đăng nhập' : 'Đăng ký'}</a></p>
    </main>
  </div>
}
