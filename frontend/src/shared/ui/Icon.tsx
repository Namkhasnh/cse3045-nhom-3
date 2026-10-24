import type { CSSProperties } from 'react'

const paths = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  trash: <><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  sparkle: <><path d="m12 3 1.4 4.1L17.5 9l-4.1 1.5L12 15l-1.5-4.5L6.5 9l4-1.9L12 3Z" /><path d="m18.5 15 .7 2.1 2.3.9-2.3.8-.7 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.1Z" /></>,
  bowl: <><path d="M3 11h18c0 5-3 8-9 8s-9-3-9-8ZM8 22h8M8 3v4M12 2v5M16 3v4" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  home: <><path d="m3 10 9-7 9 7v11H3ZM9 21v-7h6v7" /></>,
  bag: <><path d="M5 8h14l1 13H4L5 8ZM8 8V6a4 4 0 0 1 8 0v2" /></>,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  delivery: <><path d="M3 5h11v12H3ZM14 9h4l3 4v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></>,
  reset: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  alert: <><path d="m12 3 10 18H2L12 3ZM12 9v5M12 17v.1" /></>,
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = '', style }: {
  name: IconName
  className?: string
  style?: CSSProperties
}) {
  return <svg className={`icon ${className}`} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
