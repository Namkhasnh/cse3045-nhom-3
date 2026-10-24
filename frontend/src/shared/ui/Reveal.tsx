import { useEffect, useRef, useState, type ReactNode } from 'react'
// Visible by default: unsupported observers or reduced motion never hide content.
export function Reveal({ children, delay = false }: { children: ReactNode; delay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setEntered(true); observer.disconnect() }
    }, { threshold: 0.08 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`${entered ? 'reveal' : ''}${delay ? ' reveal--delay' : ''}`}>{children}</div>
}
