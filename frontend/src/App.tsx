import { useEffect, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { RoleLayout } from './app/layouts/RoleLayout'
import { RestaurantListPage } from './features/restaurants'
import { authApi, AuthPage, ProfilePage, RoleRequestsPage, type User } from './features/auth'

function roleHome(role: User['role']) { return role === 'student' ? '/' : role === 'admin' ? '/admin' : '/owner' }

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

  if (path === '/preview' && import.meta.env.DEV) return <StudentLayout path={path} preview><RestaurantListPage /></StudentLayout>
  if (session.status === 'loading') return <main className="route-state" role="status">Đang kiểm tra phiên đăng nhập…</main>
  if (path === '/login' || path === '/register' || path === '/verify-email') {
    if (session.user) return <Redirect to={roleHome(session.user.role)} />
    return <AuthPage key={path} mode={path === '/register' ? 'register' : path === '/verify-email' ? 'verify' : 'login'}
      onNavigate={navigate} onLogin={user => { setSession({ status: 'ready', user }); navigate(roleHome(user.role)) }} />
  }
  if (session.status === 'error') return <main className="route-state" role="alert">Không kết nối được máy chủ. Hãy tải lại trang.</main>
  if (!session.user || !session.user.is_active) return <Redirect to="/login" />
  const user = session.user
  const profile = <ProfilePage user={user} onUpdate={updated => setSession({ status: 'ready', user: updated })}
    onLogout={() => { setSession({ status: 'anonymous', user: null }); navigate('/login') }} />
  if (path === '/account') return user.role === 'student' ? <StudentLayout path={path}>{profile}</StudentLayout> :
    <RoleLayout user={user} title={user.role === 'admin' ? 'Quản trị' : 'Chủ quán'} path={path}>{profile}</RoleLayout>
  if (path === '/' && user.role === 'student') return <StudentLayout path={path}><RestaurantListPage /></StudentLayout>
  if (path === '/admin/role-requests' && user.role === 'admin') return <RoleLayout user={user} title="Quản trị" path={path}><RoleRequestsPage /></RoleLayout>
  if ((path === '/owner' && user.role === 'restaurant_owner') || (path === '/admin' && user.role === 'admin')) {
    return <RoleLayout user={user} title={user.role === 'admin' ? 'Quản trị' : 'Chủ quán'} path={path}>
      <h1>Xin chào, {user.display_name}</h1>
      <p className="role-empty">Các chức năng quản lý sẽ xuất hiện khi dữ liệu quán và quyền tương ứng được kết nối.</p>
    </RoleLayout>
  }
  return <main className="route-state" role="alert">Trang này không khả dụng với tài khoản của bạn. <a href={roleHome(user.role)}>Về trang chính</a></main>
}

export default App
