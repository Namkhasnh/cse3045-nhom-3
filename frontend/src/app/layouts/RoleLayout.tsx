import type { ReactNode } from 'react'
import type { User } from '../../features/auth'
import { WorkspaceLayout } from './WorkspaceLayout'

export function RoleLayout({ user, children, path }: { user: User; children: ReactNode; title: string; path: string }) {
  const admin = user.capabilities.includes('admin')
  return <WorkspaceLayout user={user} path={path} admin={admin} owner={!admin && Boolean(user.managed_restaurant_id)}>{children}</WorkspaceLayout>
}
