import { useCallback, useEffect, useRef, useState } from 'react'
import { onboardingApi, type Application, type Terms, errorMessage, OnboardingError } from '../api/onboarding.api'

export function useOnboarding(admin = false) {
  const [terms, setTerms] = useState<Terms | null>(null)
  const [items, setItems] = useState<Application[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [termsLoading, setTermsLoading] = useState(true)
  const [listLoading, setListLoading] = useState(true)
  const [listLoaded, setListLoaded] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [listError, setListError] = useState('')
  const generation = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const moreBusy = useRef(false)
  const reload = useCallback(async () => {
    const token = ++generation.current
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    moreBusy.current = false
    setTermsLoading(true); setListLoading(true); setTermsError(''); setListError('')
    const current = () => generation.current === token && !abort.signal.aborted
    await Promise.allSettled([
      onboardingApi.terms(undefined, abort.signal).then(value => {
        if (current()) setTerms(value)
      }).catch(error => {
        if (current()) setTermsError(errorMessage(error))
      }).finally(() => { if (current()) setTermsLoading(false) }),
      onboardingApi.list(admin, undefined, abort.signal).then(async page => {
        if (current()) { setItems(page.data); setCursor(page.page.next_cursor); setListLoaded(true) }
        const target=new URLSearchParams(window.location.search).get('application_id')
        if(target&&/^[1-9][0-9]*$/.test(target)&&!page.data.some(i=>i.id===target)){const item=await onboardingApi.detail(target,admin,abort.signal);if(current())setItems([item,...page.data])}
      }).catch(error => {
        if (current()) {
          setListError(errorMessage(error))
          if (error instanceof OnboardingError && [401, 403].includes(error.status)) {
            setItems([]); setCursor(null); setListLoaded(false)
          }
        }
      }).finally(() => { if (current()) setListLoading(false) }),
    ])
  }, [admin])
  const cancel = useCallback(() => { generation.current++; controller.current?.abort() }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void reload() }, 0)
    return () => { window.clearTimeout(timer); cancel() }
  }, [reload, cancel])
  const more = async () => {
    if (!cursor || moreBusy.current || listLoading || controller.current?.signal.aborted) return
    const token = generation.current
    moreBusy.current = true; setListLoading(true); setListError('')
    try {
      const page = await onboardingApi.list(admin, cursor, controller.current?.signal)
      if (generation.current === token) {
        setItems(old => { const ids = new Set(old.map(item => item.id)); return [...old, ...page.data.filter(item => !ids.has(item.id))] })
        setCursor(page.page.next_cursor)
      }
    } catch (error) {
      if (generation.current === token) {
        setListError(errorMessage(error))
        if (error instanceof OnboardingError && [401, 403].includes(error.status)) { setItems([]); setCursor(null); setListLoaded(false) }
      }
    } finally {
      if (generation.current === token) { moreBusy.current = false; setListLoading(false) }
    }
  }
  return { terms, items, cursor, termsLoading, listLoading, listLoaded, termsError, listError,
    loading: termsLoading || listLoading, error: [termsError, listError].filter(Boolean).join(' '), reload, more }
}
