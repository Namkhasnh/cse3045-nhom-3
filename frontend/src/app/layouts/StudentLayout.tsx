import type { ReactNode } from 'react'
export function StudentLayout({ children, path = '/' }: { children: ReactNode; path?: string }) {
  return <div className={`student-layout${path === '/cart' ? ' student-layout--cart' : path === '/' ? ' student-layout--home' : /^\/restaurants\/[1-9][0-9]*$/.test(path) ? ' student-layout--storefront' : ''}`}>
    <main id="main-content" className="page-container main-content" tabIndex={-1}>{children}</main>
  </div>
}
