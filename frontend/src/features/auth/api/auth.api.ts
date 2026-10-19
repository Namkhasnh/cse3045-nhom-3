export type User = { id: string; login_identifier: string; display_name: string; phone: string | null;
  email: string | null; email_verified: boolean;
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

async function request<T = User>(path: string, method = 'GET', body?: object): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrfToken()) headers['X-CSRF-Token'] = csrfToken()!
  const response = await fetch(`/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin', cache: 'no-store' })
  const payload = await response.json().catch(() => null) as { data?: T; error?: { code?: string; message?: string } } | null
  if (!response.ok || !payload?.data) throw new ApiError(response.status,
    payload?.error?.code ?? 'NETWORK_ERROR', payload?.error?.message)
  return payload.data
}

export const authApi = {
  me: () => request('/auth/me'),
  login: (login_identifier: string, password: string) => request<User | MfaChallenge>('/auth/login', 'POST', { login_identifier, password }),
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
  },
  logout: () => request('/auth/logout', 'POST', {}),
  profile: (input: { expected_version: number; display_name: string; phone: string | null }) =>
    request('/profile', 'PATCH', input),
  verifyMfa: (challenge_id: string, proof: { code: string } | { recovery_code: string }) =>
    request<User | { re_enrollment_required: true }>('/auth/admin/mfa/verify', 'POST', { challenge_id, ...proof }),
}
export type MfaChallenge = { mfa_required: true; challenge_id: string; expires_in: number }
