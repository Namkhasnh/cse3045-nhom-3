import {useCallback, useEffect, useRef, useState} from 'react'
import {RequestError, requestMessage} from '../../shared/api/request'
import {useDurableCommand} from '../../shared/hooks/useDurableCommand'
import {deliveryApi, type Point, type Policy} from './api'
import {availableDrafts, draftErrors, draftPayload, draftsFromRates, type DeliveryDraft} from './delivery-draft'

export function useOwnerDelivery(actor: string, restaurantId: string) {
  const [points, setPoints] = useState<Point[]>([])
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [drafts, setDrafts] = useState<DeliveryDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [needsReview, setNeedsReview] = useState(false)
  const [fresh, setFresh] = useState(false)
  const command = useDurableCommand(actor, 'delivery')
  const mounted = useRef(false), sequence = useRef(0), locked = useRef(false)
  const initialized = useRef(false), baseVersion = useRef(0), reviewRequired = useRef(false)
  const path = `/owner/restaurants/${restaurantId}/delivery-policy`
  const pendingHere = !command.pending || command.pending.path === path && command.pending.method === 'PUT'
  const pendingBody = useRef(pendingHere ? command.pending?.body : undefined)

  const load = useCallback(async () => {
    const token = ++sequence.current
    setLoading(true); setFresh(false); setError('')
    try {
      const [nextPoints, nextPolicy] = await Promise.all([deliveryApi.points(), deliveryApi.policy(restaurantId)])
      if (!mounted.current || token !== sequence.current) return
      if (!initialized.current) {
        const body = pendingBody.current as {pickup_rates?: Policy['pickup_rates']} | undefined
        setDrafts(draftsFromRates(body?.pickup_rates ?? nextPolicy.pickup_rates.filter(rate => nextPoints.some(point => point.id === rate.pickup_point_id && point.is_active))))
        initialized.current = true; baseVersion.current = nextPolicy.version
      } else if (baseVersion.current !== nextPolicy.version) {
        reviewRequired.current = true; setNeedsReview(true)
      }
      setPoints(nextPoints); setPolicy(nextPolicy); setFresh(true)
    } catch (cause) {
      if (!mounted.current || token !== sequence.current) return
      if (cause instanceof RequestError && [401, 403, 404].includes(cause.status)) {
        setPolicy(null); setPoints([]); setDrafts([]); initialized.current = false
      }
      setError(cause instanceof RequestError ? requestMessage(cause) : 'Không tải được cấu hình giao hàng. Vui lòng thử lại.')
    } finally {
      if (mounted.current && token === sequence.current) setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    mounted.current = true
    let active = true
    void Promise.resolve().then(() => {if (active) void load()})
    return () => {active = false; mounted.current = false}
  }, [load])

  async function refresh() {
    if (locked.current) return
    await load()
  }

  async function send(retry = false) {
    if (locked.current || loading || !pendingHere) return
    const selected = availableDrafts(points, drafts)
    if (!retry && (!policy || !fresh || reviewRequired.current || command.pending || selected.some(row => Object.values(draftErrors(row)).some(Boolean)))) return
    locked.current = true; setError(''); setNotice('')
    try {
      if (retry) await command.retry()
      else await command.run(path, 'PUT', {expected_version: policy!.version, pickup_rates: draftPayload(selected)})
      if (!mounted.current) return
      pendingBody.current = undefined
      setNotice('Đã gửi đề xuất chờ quản trị viên xác minh. Bản đã duyệt tiếp tục áp dụng.')
      // A later GET failure must never turn an acknowledged PUT into an uncertain write.
      await load()
    } catch (cause) {
      if (!mounted.current) return
      setError(requestMessage(cause))
      if (cause instanceof RequestError && cause.status === 409) {
        reviewRequired.current = true; setNeedsReview(true)
        await load()
      } else if (cause instanceof RequestError && [401, 403, 404].includes(cause.status)) {
        setPolicy(null); setPoints([]); setDrafts([]); initialized.current = false
      }
    } finally {locked.current = false}
  }

  function acknowledge() {
    if (!policy || !fresh || loading || command.busy || command.pending) return
    baseVersion.current = policy.version; reviewRequired.current = false; setNeedsReview(false)
  }

  return {points, policy, drafts, setDrafts, loading, error, notice, needsReview, fresh, command, pendingHere, refresh, send, acknowledge}
}
