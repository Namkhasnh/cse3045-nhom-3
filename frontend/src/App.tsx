import { useEffect, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { RoleLayout } from './app/layouts/RoleLayout'
import { RestaurantListPage, RestaurantMenuPage } from './features/restaurants'
import { authApi, AuthPage, ProfilePage, safeReturnPath, type User } from './features/auth'

function roleHome(user: User) { return user.capabilities.includes('admin') ? '/admin' : '/' }

function pathNow() { return window.location.pathname }

function Redirect({ to }: { to: string }) {
  useEffect(() => { window.location.replace(to) }, [to])
  return <main className="route-state" role="status">Đang chuyển trang…</main>
}

function App() {
  const [path, setPath] = useState(pathNow)
  const [session, setSession] = useState<{ status: 'loading' | 'ready' | 'anonymous' | 'error'; user: User | null }>(
    { status: 'loading', user: null })

  useEffect(() => {
    const onPopState = () => setPath(pathNow())
    window.addEventListener('popstate', onPopState)
    if (!(import.meta.env.DEV && pathNow() === '/preview')) {
      authApi.me().then(user => setSession({ status: 'ready', user })).catch(error =>
        setSession({ status: error?.status === 401 || error?.status === 403 ? 'anonymous' : 'error', user: null }))
    }
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function navigate(next: string) {
    window.history.pushState(null, '', next)
    setPath(pathNow())
    window.scrollTo(0, 0)
  }

  const publicUser = session.user?.is_active ? session.user : null
  const management = publicUser?.capabilities.includes('manage_restaurant') ? { href: '/owner', label: 'Quản lý quán' }
    : publicUser?.capabilities.includes('admin') ? { href: '/admin', label: 'Quản trị' } : undefined
  if (path === '/' || /^\/restaurants\/[1-9][0-9]*$/.test(path) || (path === '/preview' && import.meta.env.DEV)) return <StudentLayout
    path={path} preview={path === '/preview'} accountName={publicUser?.display_name}
    authReturnPath={path === '/preview' ? undefined : window.location.pathname + window.location.search + window.location.hash}
    sessionPending={path !== '/preview' && session.status === 'loading'} management={management}>
    {path.startsWith('/restaurants/') ? <RestaurantMenuPage key={path} restaurantId={path.split('/')[2]} /> : <RestaurantListPage preview={path === '/preview'} />}
  </StudentLayout>
  if (session.status === 'loading') return <main className="route-state" role="status">Đang kiểm tra phiên đăng nhập…</main>
  if (path === '/login' || path === '/register' || path === '/verify-email') {
    if (session.user) return <Redirect to={safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) ?? roleHome(session.user)} />
    return <AuthPage key={path} mode={path === '/register' ? 'register' : path === '/verify-email' ? 'verify' : 'login'}
      onNavigate={navigate} onLogin={user => { setSession({ status: 'ready', user }); navigate(safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) ?? roleHome(user)) }} />
  }
  if (session.status === 'error') return <main className="route-state" role="alert">Không kết nối được máy chủ. Hãy tải lại trang.</main>
  if (!session.user || !session.user.is_active) return <Redirect to={`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`} />
  const user = session.user
  const profile = <ProfilePage user={user} onUpdate={updated => setSession({ status: 'ready', user: updated })}
    onLogout={() => { setSession({ status: 'anonymous', user: null }); navigate('/login') }} />
  if (path === '/account') return !user.capabilities.includes('admin') && !user.capabilities.includes('manage_restaurant') ? <StudentLayout path={path} accountName={user.display_name}>{profile}</StudentLayout> :
    <RoleLayout user={user} title={user.capabilities.includes('admin') ? 'Quản trị' : 'Chủ quán'} path={path}>{profile}</RoleLayout>

  if ((path === '/owner' && user.capabilities.includes('manage_restaurant')) || (path === '/admin' && user.capabilities.includes('admin'))) {
    return <RoleLayout user={user} title={user.capabilities.includes('admin') ? 'Quản trị' : 'Chủ quán'} path={path}>
      <h1>Xin chào, {user.display_name}</h1>
      <p className="role-empty">Các chức năng quản lý sẽ xuất hiện khi dữ liệu quán và quyền tương ứng được kết nối.</p>
    </RoleLayout>
  }
  return <main className="route-state" role="alert">Trang này không khả dụng với tài khoản của bạn. <a href={roleHome(user)}>Về trang chính</a></main>
}

export default App
