import {mutationFeedback,showFeedback} from '../../../shared/lib/feedback'
export type User = { id: string; login_identifier: string; display_name: string; phone: string | null;
  avatar_image_reference?:string|null; email: string | null; email_verified: boolean;
  capabilities: string[]; managed_restaurant_id: string | null; is_active: boolean; version: number; updated_at: string }

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message?: string) {
    super(message ?? code); this.status = status; this.code = code
  }
}

function csrfToken() {
  return document.cookie.split(';').map(value => value.trim())
    .find(value => value.startsWith('__Host-hlf_csrf='))?.split('=')[1]
}

async function request<T = User>(path: string, method = 'GET', body?: object, timeoutMs?: number, requestKey?:string): Promise<T> {
  const headers: Record<string, string> = requestKey?{'Idempotency-Key':requestKey}:{}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrfToken()) headers['X-CSRF-Token'] = csrfToken()!
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const exchange = async () => {
    const response = await fetch(`/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
    const payload = await response.json().catch(() => null) as { data?: T; error?: { code?: string; message?: string } } | null
    if (!response.ok || !payload?.data) throw new ApiError(response.status,
      payload?.error?.code ?? 'NETWORK_ERROR', payload?.error?.message)
    const feedback=mutationFeedback(path,method,payload.data)
    if(feedback)showFeedback(feedback)
    return payload.data
  }
  try {
    if (!timeoutMs) return await exchange()
    // Bound both headers and response-body reads, even if a transport ignores abort.
    return await Promise.race([exchange(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => { reject(new ApiError(0, 'REQUEST_TIMEOUT')); controller.abort() }, timeoutMs)
    })])
  } finally { clearTimeout(timer) }
}

export const authApi = {
  recoveryStart:(login_identifier:string)=>request<{accepted:true}>('/auth/recovery/start','POST',{login_identifier},15000),
  recoveryComplete:(login_identifier:string,code:string,new_password:string)=>request<{recovered:true}>('/auth/recovery/complete','POST',{login_identifier,code,new_password},15000),
  me: () => request('/auth/me'),
  login: (login_identifier: string, password: string) => request<User | MfaChallenge>('/auth/login', 'POST', { login_identifier, password }, 15000),
  register: (input: { login_identifier: string; password: string; display_name: string; phone: string | null;
    email: string }) =>
    request('/auth/register', 'POST', input),
  verifyEmail: (login_identifier: string, code: string) =>
    request('/auth/verify-email', 'POST', { login_identifier, code }),
  resendEmailCode: async (login_identifier: string) => {
    const response = await fetch('/api/v1/auth/resend-email-code', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_identifier }), credentials: 'same-origin' })
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
      throw new ApiError(response.status, payload?.error?.code ?? 'NETWORK_ERROR', payload?.error?.message)
    }
    showFeedback('Đã tiếp nhận yêu cầu gửi lại mã xác minh. Hãy kiểm tra email.')
  },
  logout: () => request('/auth/logout', 'POST', {}),
  avatar:(expected_version:number,image:{mime_type:string;content_base64:string}|null,key:string)=>request<User>('/profile/avatar','POST',{expected_version,image},undefined,key),
  startEmailChange:(input:{expected_version:number;new_email:string;password:string},key:string)=>request<{challenge_id:string;expires_in:number;resend_after:number}>('/profile/email-change','POST',input,undefined,key),
  confirmEmailChange:(input:{challenge_id:string;code:string},key:string)=>request<{changed:true;reauthentication_required:true}>('/profile/email-change/confirm','POST',input,undefined,key),
  profile: (input: { expected_version: number; display_name: string; phone: string | null }) =>
    request('/profile', 'PATCH', input),
  verifyMfa: (challenge_id: string, proof: { code: string } | { recovery_code: string }) =>
    request<User | { re_enrollment_required: true }>('/auth/admin/mfa/verify', 'POST', { challenge_id, ...proof }, 15000),
}
export type MfaChallenge = { mfa_required: true; challenge_id: string; expires_in: number }
