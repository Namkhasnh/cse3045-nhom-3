import { useEffect, useState } from 'react'
import { deliveryApi, type Quote } from './api'
import { usePickupPoints } from './use-pickup-points'
import { loadCartPoint, saveCartPoint } from './cart-point'
import { requestMessage } from '../../shared/api/request'

export function useCartDelivery(accountId: string | null, restaurantId: string, intentKey: string, canQuote: boolean) {
  const pointsState = usePickupPoints()
  const [selection, setSelection] = useState(() => ({ point: accountId ? loadCartPoint(accountId, restaurantId) : '', revision: 0 }))
  const point = selection.point
  const setPoint = (point: string) => setSelection(previous => ({ point, revision: previous.revision + 1 }))
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; quote: Quote | null; error: string; expired: boolean } | null>(null)
  const validPoint = pointsState.points.some(p => p.id === point && p.is_active)
  const key = JSON.stringify([accountId, restaurantId, intentKey, point, selection.revision, attempt, canQuote, validPoint])
  const enabled = Boolean(accountId && restaurantId && intentKey && validPoint && canQuote && !pointsState.pointsLoading && !pointsState.pointsError)
  useEffect(() => {
    if (!enabled) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    deliveryApi.quote(restaurantId, point).then(quote => {
      if (!active) return
      if (quote.destination.pickup_point_id !== point) throw new Error('Báo phí không khớp điểm nhận.')
      const lifetime = Date.parse(quote.expires_at) - Date.now()
      setResult({ key, quote: lifetime > 0 ? quote : null, expired: !(lifetime > 0), error: '' })
      if (lifetime > 0) timer = setTimeout(() => setResult({ key, quote: null, expired: true, error: '' }), lifetime)
    }).catch(error => { if (active) setResult({ key, quote: null, expired: false, error: requestMessage(error) }) })
    return () => { active = false; clearTimeout(timer) }
  }, [enabled, key, restaurantId, point])
  const current = enabled && result?.key === key ? result : null
  return { ...pointsState, point, setPoint, quote: current?.quote ?? null, error: current?.error ?? '', expired: current?.expired ?? false,
    busy: enabled && !current, retry: () => setAttempt(v => v + 1),
    remember: () => { if (!current?.quote || Date.parse(current.quote.expires_at) <= Date.now()) throw new Error('Báo phí đã hết hạn.'); if (accountId && validPoint) saveCartPoint(accountId, restaurantId, point, current.quote, intentKey) } }
}
