import type { CSSProperties } from 'react'

const paths = {
  shop: <><path d="M4 10v11h16V10M3 4h18l-2 6H5Z" /><path d="M9 21v-6h6v6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  book: <><path d="M4 5a3 3 0 0 1 3-3h13v17H7a3 3 0 0 0-3 3ZM4 5v17" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M3 12h18" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 3 2.6c-.5.2-.5.8-.5 1.4M12 17h.01" /></>,
  inbox: <><path d="M4 4h16v16H4ZM4 14h4l2 3h4l2-3h4" /></>,
  logout: <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />,
  qr: <path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h2v2h-2ZM18 14h2v6h-6v-2" />,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12M15 11h5v4h-5Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
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
