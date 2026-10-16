import type { ReactNode } from 'react'

export function FilterChip({ selected, onClick, children }: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return <button type="button" className="filter-chip" aria-pressed={selected} onClick={onClick}>{children}</button>
}
