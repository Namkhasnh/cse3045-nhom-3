import { useEffect, useRef, useState } from 'react'
import { catalogApi, filterQuery, type Page, type Restaurant, type Dish } from '../api/catalog.api'
import type { RestaurantFilterValues } from '../types'
export function useCatalog<T extends Restaurant | Dish>(filters: RestaurantFilterValues, restaurantId?: string, resource: 'restaurants' | 'dishes' = restaurantId ? 'dishes' : 'restaurants') {
  const [data, setData] = useState<T[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [moreError, setMoreError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [retry, setRetry] = useState(0)
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const generation = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const key = filterQuery(filters).toString()
  const requestKey = `${resource}:${restaurantId ?? ''}:${key}:${retry}`
  useEffect(() => {
    const token = ++generation.current
    controller.current?.abort()
    const abort = new AbortController(); controller.current = abort
    const query = new URLSearchParams(key)
    if (restaurantId) query.set('restaurant_id', restaurantId)
    const timer = window.setTimeout(() => {
      setData([]); setCursor(null); setStatus('loading'); setLoadingMore(false); setMoreError(false)
      const request = resource === 'dishes' ? catalogApi.dishes(query, abort.signal) : catalogApi.restaurants(query, abort.signal)
      request.then(page => { if (generation.current === token && !abort.signal.aborted) {
        setLoadedKey(requestKey); setData(page.data as T[]); setCursor(page.page.next_cursor); setStatus('ready')
      } }).catch(() => { if (!abort.signal.aborted && generation.current === token) { setLoadedKey(requestKey); setStatus('error') } })
    }, 250)
    return () => { window.clearTimeout(timer); abort.abort() }
  }, [key, restaurantId, resource, retry, requestKey])
  async function loadMore() {
    if (!cursor || loadingMore || loadedKey !== requestKey || controller.current?.signal.aborted) return
    const token = generation.current
    const query = new URLSearchParams(key); query.set('cursor', cursor)
    if (restaurantId) query.set('restaurant_id', restaurantId)
    setLoadingMore(true); setMoreError(false)
    try {
      const page = await (resource === 'dishes' ? catalogApi.dishes(query, controller.current?.signal) : catalogApi.restaurants(query, controller.current?.signal)) as Page<T>
      if (generation.current === token && !controller.current?.signal.aborted) {
        setData(old => { const ids = new Set(old.map(d => d.id)); return [...old, ...page.data.filter(d => !ids.has(d.id))] })
        setCursor(page.page.next_cursor)
      }
    } catch { if (generation.current === token) setMoreError(true) }
    finally { if (generation.current === token) setLoadingMore(false) }
  }
  return { data: loadedKey === requestKey ? data : [], status: loadedKey === requestKey ? status : 'loading' as const, moreError, loadingMore, hasMore: loadedKey === requestKey && cursor !== null, loadMore, retry: () => setRetry(v => v + 1) }
}
