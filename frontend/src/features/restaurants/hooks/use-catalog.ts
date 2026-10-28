import { useEffect, useRef, useState } from 'react'
import { catalogApi, filterQuery, type Page, type Restaurant, type Dish } from '../api/catalog.api'
import type { RestaurantFilterValues } from '../types'
export function useCatalog<T extends Restaurant | Dish>(filters: RestaurantFilterValues, restaurantId?: string, resource: 'restaurants' | 'dishes' = restaurantId ? 'dishes' : 'restaurants', autoRefresh = false) {
  const [data, setData] = useState<T[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshError, setRefreshError] = useState(false)
  const pages = useRef<(string | null)[]>([null])
  const busy = useRef(false)
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
    pages.current = [null]
    busy.current = true
    controller.current?.abort()
    const abort = new AbortController(); controller.current = abort
    const query = new URLSearchParams(key)
    if (restaurantId) query.set('restaurant_id', restaurantId)
    const timer = window.setTimeout(() => {
      setData([]); setCursor(null); setStatus('loading'); setLoadingMore(false); setMoreError(false); setRefreshError(false)
      const request = resource === 'dishes' ? catalogApi.dishes(query, abort.signal) : catalogApi.restaurants(query, abort.signal)
      request.then(page => { if (generation.current === token && !abort.signal.aborted) {
        setLoadedKey(requestKey); setData(page.data as T[]); setCursor(page.page.next_cursor); setStatus('ready')
      } }).catch(() => { if (!abort.signal.aborted && generation.current === token) { setLoadedKey(requestKey); setStatus('error') } }).finally(() => { if (generation.current === token) busy.current = false })
    }, 250)
    async function refresh() {
      if (!autoRefresh || busy.current || abort.signal.aborted || document.visibilityState === 'hidden') return
      if (!navigator.onLine) { setRefreshError(true); return }
      busy.current = true
      try {
        // Replay loaded pages sequentially with fresh cursors; old cursors can be invalidated by catalog changes.
        const count = pages.current.length
        const nextPages: (string | null)[] = []
        const rows = new Map<string, T>()
        let next: string | null = null
        for (let index = 0; index < count; index++) {
          const query = new URLSearchParams(key)
          if (restaurantId) query.set('restaurant_id', restaurantId)
          if (next) query.set('cursor', next)
          nextPages.push(next)
          const page = await (resource === 'dishes' ? catalogApi.dishes(query, abort.signal) : catalogApi.restaurants(query, abort.signal))
          for (const row of page.data) rows.set(row.id, row as T)
          next = page.page.next_cursor
          if (!next) break
        }
        if (generation.current === token && !abort.signal.aborted) {
          pages.current = nextPages
          setData([...rows.values()]); setCursor(next); setRefreshError(false)
          setLoadedKey(requestKey); setStatus('ready')
        }
      } catch {
        if (generation.current === token && !abort.signal.aborted) setRefreshError(true)
      } finally { if (generation.current === token) busy.current = false }
    }
    const offline = () => { if (autoRefresh) setRefreshError(true) }
    const interval = autoRefresh ? window.setInterval(() => void refresh(), 60_000) : undefined
    if (autoRefresh) {
      window.addEventListener('online', refresh)
      window.addEventListener('offline', offline)
      document.addEventListener('visibilitychange', refresh)
    }
    return () => {
      window.clearTimeout(timer); window.clearInterval(interval); abort.abort()
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', offline)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [key, restaurantId, resource, retry, requestKey, autoRefresh])
  async function loadMore() {
    if (!cursor || busy.current || loadingMore || loadedKey !== requestKey || controller.current?.signal.aborted) return
    const token = generation.current
    const query = new URLSearchParams(key); query.set('cursor', cursor)
    if (restaurantId) query.set('restaurant_id', restaurantId)
    busy.current = true
    setLoadingMore(true); setMoreError(false)
    try {
      const page = await (resource === 'dishes' ? catalogApi.dishes(query, controller.current?.signal) : catalogApi.restaurants(query, controller.current?.signal)) as Page<T>
      if (generation.current === token && !controller.current?.signal.aborted) {
        setData(old => { const ids = new Set(old.map(d => d.id)); return [...old, ...page.data.filter(d => !ids.has(d.id))] })
        pages.current.push(cursor)
        setCursor(page.page.next_cursor)
      }
    } catch { if (generation.current === token) setMoreError(true) }
    finally { if (generation.current === token) { busy.current = false; setLoadingMore(false) } }
  }
  return { refreshError, data: loadedKey === requestKey ? data : [], status: loadedKey === requestKey ? status : 'loading' as const, moreError, loadingMore, hasMore: loadedKey === requestKey && cursor !== null, loadMore, retry: () => setRetry(v => v + 1) }
}
