import { CartRoutePage } from './app/pages/CartRoutePage'
import { AppShell } from './app/layouts/AppShell'
import {RecommendationsPage,type Recommendation} from './features/recommendations'
import {deliveryApi} from './features/delivery'
import {NotificationProvider,InboxPage,AdminTasksPage,SetupChecklist} from './features/notifications'
import {UsersPage,AuditPage,SupportPage,PrivacyPage} from './features/administration'
import {PaymentPanel,PaymentsPage} from './features/payments'
import {HistoryPage,OrderPage,OwnerOrdersPage} from './features/orders'
import {CheckoutPage} from './app/pages/CheckoutPage'
import {OwnerCommissionPage,AdminCommissionPage,FinancePage} from './features/commissions'
import {OwnerMenuPage,AdminCategoriesPage} from './features/dishes'
import {OwnerDeliveryPage,AdminDeliveryPage} from './features/delivery'
import { useEffect, useRef, useState } from 'react'
import { StudentLayout } from './app/layouts/StudentLayout'
import { RoleLayout } from './app/layouts/RoleLayout'
import { RestaurantListPage, RestaurantMenuPage, RestaurantSettingsPage, AdminRestaurantsPage, catalogApi } from './features/restaurants'
import { CartProvider, CartDrawer, useCart } from './features/cart'
import { ApplicationsPage,AdminApplicationsPage } from './features/onboarding'
import { formatVnd } from './shared/lib/format'
import { authApi, AuthPage, CredentialRecoveryPage, ProfilePage, safeReturnPath, type User } from './features/auth'

const recommendationOptions=async()=>{const [points,categories]=await Promise.all([deliveryApi.points(),catalogApi.categories()]);return {points,categories}}

function roleHome(user: User) { if(!user.is_active)return '/support';return user.capabilities.includes('admin') ? '/admin' : '/' }

function pathNow() { return window.location.pathname }

function Redirect({ to }: { to: string }) {
  useEffect(() => { window.location.replace(to) }, [to])
  return <main id="main-content" tabIndex={-1} className="route-state" role="status">Đang chuyển trang…</main>
}

function AppRoutes() {
  const cart = useCart()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sessionRequest = useRef(0)
  const [path, setPath] = useState(pathNow)
  const [session, setSession] = useState<{ status: 'loading' | 'ready' | 'anonymous' | 'error'; user: User | null }>(
    { status: 'loading', user: null })

  useEffect(() => {
    let active = true
    const onPopState = () => setPath(pathNow())
    const checkSession = () => {
      if (import.meta.env.DEV && pathNow() === '/preview') return
      const token = ++sessionRequest.current
      // Background revalidation must preserve an in-progress private form/file selection.
      authApi.me().then(user => { if (active && sessionRequest.current === token) setSession({ status: 'ready', user }) }).catch(error => {
        if (active && sessionRequest.current === token) setSession({ status: error?.status === 401 || error?.status === 403 ? 'anonymous' : 'error', user: null })
      })
    }
    const onVisible = () => { if (document.visibilityState === 'visible') checkSession() }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('focus', checkSession)
    document.addEventListener('visibilitychange', onVisible)
    checkSession()
    return () => { active = false; window.removeEventListener('popstate', onPopState); window.removeEventListener('focus', checkSession); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  const onboardingAccountId=session.user?.id
  useEffect(() => { if (onboardingAccountId) { const own='hlf.onboarding.'+onboardingAccountId; try { for (const key of Object.keys(sessionStorage)) if (key.startsWith('hlf.setup.')&&!key.endsWith('.administration')&&!key.startsWith('hlf.setup.'+onboardingAccountId+'.')) sessionStorage.removeItem(key); else if (key.startsWith('hlf.onboarding.') && key!==own && !key.startsWith(own+'.')) sessionStorage.removeItem(key) } catch { /* storage unavailable */ } } }, [onboardingAccountId])
  const refreshCart = cart.refresh
  useEffect(() => { refreshCart() }, [path, session.user?.id, session.status, refreshCart])

  function navigate(next: string) {
    window.history.pushState(null, '', next)
    setPath(pathNow())
    window.scrollTo(0, 0)
  }

  return <NotificationProvider key={session.user?.id??'guest'} actor={session.status==='ready'&&session.user?.is_active?session.user.id:null}><AppShell user={session.user} pending={path !== '/preview' && session.status === 'loading'} cartCount={cart.count} path={path} onOpenCart={/^\/restaurants\/[1-9][0-9]*$/.test(path) ? () => setDrawerOpen(true) : undefined}>{renderRoutes()}{drawerOpen && <CartDrawer onClose={() => setDrawerOpen(false)} />}</AppShell></NotificationProvider>
  function renderRoutes(){
  const publicUser = session.user?.is_active ? session.user : null
  if (path === '/' || path === '/cart' || /^\/restaurants\/[1-9][0-9]*$/.test(path) || (path === '/preview' && import.meta.env.DEV)) return <StudentLayout
    path={path}>
    {import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO === 'true' && <p className="form-notice" role="note">Môi trường local có dữ liệu giả lập. Quán và món có nhãn “Mẫu” chỉ dùng để trải nghiệm, không phải đối tác đang bán thật.</p>}
    {cart.storageWarning && <p className="form-notice" role="alert">{cart.storageWarning}</p>}
    <p className={`cart-notice${cart.notice && !cart.notice.startsWith('Đã') ? ' form-error' : ''}`} role={cart.notice && !cart.notice.startsWith('Đã') ? 'alert' : 'status'} aria-live="polite">{cart.notice}{cart.notice.startsWith('Đã thêm') && <> <a href="/cart">Xem giỏ · {cart.count} phần · {formatVnd(cart.subtotal)}</a></>}</p>
    {path === '/cart' ? <CartRoutePage key={cart.draft?.restaurant.id+':'+(publicUser?.id??'guest')} accountId={publicUser?.id??null} sessionPending={session.status === 'loading'} canQuote={Boolean(publicUser?.capabilities.includes('buy'))} /> : path.startsWith('/restaurants/') ? <RestaurantMenuPage key={path} restaurantId={path.split('/')[2]} onAddDish={cart.add} cartSummary={cart} onOpenCart={() => setDrawerOpen(true)} /> : <RestaurantListPage preview={path === '/preview'} /> }
  </StudentLayout>
  if (session.status === 'loading') return <main id="main-content" tabIndex={-1} className="route-state" role="status">Đang kiểm tra phiên đăng nhập…</main>
  if(path==='/recover-access')return <CredentialRecoveryPage/>
  if (path === '/login' || path === '/register' || path === '/verify-email') {
    if (session.user) return <Redirect to={safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) ?? roleHome(session.user)} />
    return <AuthPage key={path} mode={path === '/register' ? 'register' : path === '/verify-email' ? 'verify' : 'login'}
      onNavigate={navigate} onLogin={user => { sessionRequest.current++; setSession({ status: 'ready', user }); navigate(safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) ?? roleHome(user)) }} />
  }
  if (session.status === 'error') return <main id="main-content" tabIndex={-1} className="route-state" role="alert">Không kết nối được máy chủ. Hãy tải lại trang.</main>
  if (!session.user) return <Redirect to={`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`} />
  const user = session.user
  const profile = <ProfilePage user={user} onUpdate={updated => setSession({ status: 'ready', user: updated })}
    onLogout={() => { try { for (const key of Object.keys(sessionStorage)) if (key.startsWith('hlf.onboarding.')||key.startsWith('hlf.setup.')&&!key.endsWith('.administration')) sessionStorage.removeItem(key) } catch { /* storage unavailable */ } sessionRequest.current++; setSession({ status: 'anonymous', user: null }); navigate('/login') }} />
  if(path==='/support'||path==='/admin/support'&&user.capabilities.includes('admin')||path==='/privacy'){
    const content=path==='/privacy'?<PrivacyPage key={user.id} actor={user.id} protectedAccount={user.capabilities.includes('admin')}/>:<SupportPage key={user.id} actor={user.id} admin={user.capabilities.includes('admin')}/>
    return user.capabilities.includes('admin')||user.managed_restaurant_id?<RoleLayout user={user} title={user.capabilities.includes('admin')?'Quản trị':'Chủ quán'} path={path}>{content}</RoleLayout>:<StudentLayout path={path}>{!user.is_active&&<p role="alert">Tài khoản đã đình chỉ; chỉ xử lý nghĩa vụ cũ.</p>}{content}</StudentLayout>
  }
  if(path==='/admin/users'&&user.capabilities.includes('admin'))return <RoleLayout user={user} title="Quản trị" path={path}><UsersPage key={user.id} actor={user.id}/></RoleLayout>
  if(path==='/admin/audit'&&user.capabilities.includes('admin'))return <RoleLayout user={user} title="Quản trị" path={path}><AuditPage key={user.id} actor={user.id}/></RoleLayout>
  if(!user.is_active&&!['/orders','/account','/owner/finance'].includes(path)&&!/^\/orders\/[1-9][0-9]*$/.test(path)&&path!=='/owner/restaurants/'+user.managed_restaurant_id+'/orders')return <RoleLayout user={user} title="Quyền truy cập giới hạn" path={path}><p role="alert">Tài khoản đã đình chỉ. Chỉ xử lý nghĩa vụ cũ.</p><a href="/support">Mở hỗ trợ</a></RoleLayout>
  if (path === '/orders' && (user.capabilities.includes('buy')||user.capabilities.includes('obligations'))) return <StudentLayout path={path}><HistoryPage key={user.id} accountId={user.id}/></StudentLayout>
  if (/^\/orders\/[1-9][0-9]*$/.test(path) && (user.capabilities.includes('buy')||user.capabilities.includes('obligations'))) return <StudentLayout path={path}><OrderPage key={user.id+path} id={path.split('/')[2]} accountId={user.id} renderPayment={(o,apply)=>o.payment?.method==='qr'?<PaymentPanel key={user.id+':'+o.id} actor={user.id} restaurant={o.restaurant_id} orderId={o.id} orderStatus={o.status} payment={o.payment} onPayment={apply}/>:null}/></StudentLayout>
  if (user.managed_restaurant_id&&path==='/owner/restaurants/'+user.managed_restaurant_id+'/orders') return <RoleLayout user={user} title="Chủ quán" path={path}><OwnerOrdersPage restricted={!user.is_active} key={user.id} restaurantId={user.managed_restaurant_id} accountId={user.id} renderPayment={(o,apply)=>o.payment?.method==='qr'?<PaymentPanel key={user.id+':'+o.id} actor={user.id} restaurant={o.restaurant_id} orderId={o.id} orderStatus={o.status} payment={o.payment} owner onPayment={apply}/>:null}/></RoleLayout>
  if (path === '/recommendations' && user.capabilities.includes('buy') && !user.capabilities.includes('admin')) return <StudentLayout path={path}><RecommendationsPage key={user.id} actor={user.id} loadOptions={recommendationOptions} onSelect={async(row:Recommendation)=>{const [restaurant,dish]=await Promise.all([catalogApi.restaurant(row.restaurant_id),catalogApi.dish(row.dish_id)]);if(!restaurant.is_active||!restaurant.is_open||!restaurant.is_accepting_orders||!dish.is_available||dish.restaurant_id!==restaurant.id||dish.price_vnd!==row.unit_price_vnd)throw new Error('Changed catalog');cart.add(restaurant,dish)}}/></StudentLayout>
  if (path === '/checkout'  && user.capabilities.includes('buy')) return <StudentLayout path={path}><CheckoutPage key={user.id} accountId={user.id}/></StudentLayout>
  if (path === '/open-restaurant') return <StudentLayout path={path}><ApplicationsPage renderSetup={id=><SetupChecklist key={id} restaurantId={id}/>} key={user.id} userId={user.id} canApply={user.capabilities.includes('apply_for_restaurant')&&!user.capabilities.includes('admin')} /></StudentLayout>
  if (path === '/account') return !user.capabilities.includes('admin') && !user.capabilities.includes('manage_restaurant') ? <StudentLayout path={path}>{profile}</StudentLayout> :
    <RoleLayout user={user} title={user.capabilities.includes('admin') ? 'Quản trị' : 'Chủ quán'} path={path}>{profile}</RoleLayout>

  if(path==='/notifications'&&user.is_active)return user.managed_restaurant_id||user.capabilities.includes('admin')?<RoleLayout user={user} title={user.capabilities.includes('admin')?'Quản trị':'Chủ quán'} path={path}><InboxPage/></RoleLayout>:<StudentLayout path={path}><InboxPage/></StudentLayout>
  if(path==='/admin'&&user.capabilities.includes('admin'))return <RoleLayout user={user} title="Quản trị" path={path}><AdminTasksPage/></RoleLayout>
  if(path==='/owner/payments'&&user.managed_restaurant_id)return <RoleLayout user={user} title="Chủ quán" path={path}><PaymentsPage key={user.id} actor={user.id} restaurant={user.managed_restaurant_id}/></RoleLayout>
  if(path==='/admin/payments'&&user.capabilities.includes('admin'))return <RoleLayout user={user} title="Quản trị" path={path}><PaymentsPage key={user.id} actor={user.id} admin/></RoleLayout>
  if (path === '/admin/applications' && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><AdminApplicationsPage key={user.id} adminId={user.id} renderSetup={id=><SetupChecklist key={id} restaurantId={id}/>}/></RoleLayout>
  if (path === '/admin/restaurants' && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><AdminRestaurantsPage key={user.id} renderSetup={(id,version)=><SetupChecklist key={id} restaurantId={id} version={version}/>}/></RoleLayout>
  if (path === '/owner/finance' && user.managed_restaurant_id) return <RoleLayout user={user} title="Chủ quán" path={path}><FinancePage key={user.id} actor={user.id} restaurant={user.managed_restaurant_id}/></RoleLayout>
  if ((path === '/admin/settlements' || path === '/admin/reports') && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><FinancePage key={user.id} actor={user.id} admin/></RoleLayout>
  if (path === '/owner/commission' && user.managed_restaurant_id) return <RoleLayout user={user} title="Chủ quán" path={path}><OwnerCommissionPage key={user.id} actor={user.id} restaurantId={user.managed_restaurant_id}/></RoleLayout>
  if (path === '/admin/commissions' && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><AdminCommissionPage key={user.id} actor={user.id}/></RoleLayout>
  if (path === '/owner/menu' && user.managed_restaurant_id) return <RoleLayout user={user} title="Chủ quán" path={path}><OwnerMenuPage key={user.id} actor={user.id} restaurantId={user.managed_restaurant_id}/></RoleLayout>
  if (path === '/admin/categories' && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><AdminCategoriesPage key={user.id} actor={user.id}/></RoleLayout>
  if (path === '/owner/delivery' && user.managed_restaurant_id) return <RoleLayout user={user} title="Chủ quán" path={path}><OwnerDeliveryPage key={user.id} actor={user.id} restaurantId={user.managed_restaurant_id}/></RoleLayout>
  if (path === '/admin/delivery' && user.capabilities.includes('admin')) return <RoleLayout user={user} title="Quản trị" path={path}><AdminDeliveryPage key={user.id} actor={user.id}/></RoleLayout>
  if (path === '/owner' && user.capabilities.includes('manage_restaurant')) return <RoleLayout user={user} title="Chủ quán" path={path}><RestaurantSettingsPage key={user.id} renderSetup={(id,version)=><SetupChecklist key={id} restaurantId={id} version={version}/>}/></RoleLayout>
  if ((path === '/owner' && user.capabilities.includes('manage_restaurant')) || (path === '/admin' && user.capabilities.includes('admin'))) {
    return <RoleLayout user={user} title={user.capabilities.includes('admin') ? 'Quản trị' : 'Chủ quán'} path={path}>
      <h1>Xin chào, {user.display_name}</h1>
      <p className="role-empty">Các chức năng quản lý sẽ xuất hiện khi dữ liệu quán và quyền tương ứng được kết nối.</p>
    </RoleLayout>
  }
  return <main id="main-content" tabIndex={-1} className="route-state" role="alert">Trang này không khả dụng với tài khoản của bạn. <a href={roleHome(user)}>Về trang chính</a></main>
  }
}

export default function App() { return <CartProvider catalog={catalogApi}><AppRoutes /></CartProvider> }
