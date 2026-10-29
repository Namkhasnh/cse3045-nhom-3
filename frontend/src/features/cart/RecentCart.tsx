import { useEffect, useRef } from 'react'
import { useCart } from './use-cart'
import { Icon } from '../../shared/ui/Icon'
import { formatVnd } from '../../shared/lib/format'
import './recent-cart.css'

export function RecentCart({ onOpen }: { onOpen: () => void }) {
  const cart = useCart()
  const handledAddition = useRef(cart.addition)
  const target = useRef<HTMLButtonElement>(null)
  const flights = useRef<Set<Animation>>(new Set())
  useEffect(() => {
    const active = flights.current
    return () => { for (const animation of active) animation.cancel(); active.clear() }
  }, [])
  useEffect(() => {
    if (handledAddition.current === cart.addition) return
    handledAddition.current = cart.addition
    const origin = cart.addition?.origin, button = target.current
    if (!origin || !button || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = button.getBoundingClientRect()
    const x = rect.left + 28, y = rect.top + rect.height / 2
    const flyer = document.createElement('span')
    flyer.className = 'cart-flying-dish'
    flyer.setAttribute('aria-hidden', 'true')
    if (origin.image) {
      const image = document.createElement('img'); image.src = origin.image; image.alt = ''; flyer.append(image)
    } else flyer.textContent = '＋'
    flyer.style.left = `${origin.x - 28}px`; flyer.style.top = `${origin.y - 28}px`
    document.body.append(flyer)
    const animation = flyer.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${(x - origin.x) * .45}px,${Math.min(-70, (y - origin.y) * .35)}px) scale(.9)`, opacity: 1, offset: .4 },
      { transform: `translate(${x - origin.x}px,${y - origin.y}px) scale(.18)`, opacity: .15 },
    ], { duration: 650, easing: 'cubic-bezier(.3,.05,.65,1)', fill: 'forwards' })
    const active = flights.current
    active.add(animation)
    animation.finished.then(() => {
      if (button.isConnected) {
        const pulse = button.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 230 })
        active.add(pulse); pulse.finished.then(() => active.delete(pulse), () => active.delete(pulse))
      }
    }, () => {}).finally(() => { flyer.remove(); active.delete(animation) })
  }, [cart.addition])
  if (!cart.count) return null
  return <button ref={target} type="button" className="recent-cart-trigger storefront-cart-trigger" onClick={onOpen} aria-haspopup="dialog" aria-label={`Giỏ hàng, ${cart.count} phần, ${formatVnd(cart.subtotal)}`}>
    <Icon name="bag" /><span>Giỏ hàng · {cart.count} phần</span><strong>{formatVnd(cart.subtotal)}</strong><Icon name="arrow" />
  </button>
}
