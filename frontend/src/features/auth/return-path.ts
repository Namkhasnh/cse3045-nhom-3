// Only implemented application destinations may survive authentication.
export function safeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || (value.includes('\\') || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127))) return null
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || !(/^\/(?:account|owner|admin)?$/.test(url.pathname) || /^\/restaurants\/[1-9][0-9]*$/.test(url.pathname))) return null
    return url.pathname + url.search + url.hash
  } catch { return null }
}

export function authPath(path: string) {
  const target = safeReturnPath(new URLSearchParams(window.location.search).get('returnTo'))
  if (!target) return path
  const url = new URL(path, window.location.origin)
  url.searchParams.set('returnTo', target)
  return url.pathname + url.search
}
