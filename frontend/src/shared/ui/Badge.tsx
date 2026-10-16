import type { ReactNode } from 'react'

export function Badge({ tone = 'neutral', children }: {
  tone?: 'neutral' | 'success' | 'warning'
  children: ReactNode
}) {
  return <span className={`badge badge--${tone}`}><span className="badge-dot" aria-hidden="true" />{children}</span>
}
