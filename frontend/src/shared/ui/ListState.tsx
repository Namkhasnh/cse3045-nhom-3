import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'

export function ListState({ title, children, icon = 'search', action, onAction, error = false }: {
  title: string
  children: ReactNode
  icon?: IconName
  action?: string
  onAction?: () => void
  error?: boolean
}) {
  return <div className={`list-state ${error ? 'list-state--error' : ''}`} role={error ? 'alert' : 'status'}>
    <span className="list-state-icon"><Icon name={icon} /></span>
    <h3>{title}</h3><p>{children}</p>
    {action && onAction && <Button onClick={onAction}>{action}</Button>}
  </div>
}
