import {useCallback, useEffect, useRef, useState} from 'react'
import type {Notice} from './api'
import {NotificationSound} from './notification-sound'

type Preferences = {popup: boolean; sound: boolean}
export type NoticeBatch = {notice: Notice; extra: number}
export type NotificationAlerts = {
  preferences: Preferences; soundReady: boolean
  setPreference: (key: keyof Preferences, enabled: boolean) => void
  activateSound: () => void; dismissAlert: (id?: string) => void
  setPreviewOpen: (open: boolean) => void
}
function load(actor: string | null): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem('hlf.notification-alerts.' + actor) ?? '{}')
    return {popup: saved?.popup !== false, sound: saved?.sound === true}
  } catch { return {popup: true, sound: false} }
}
export function useNotificationAlerts(actor: string | null) {
  const [preferences, setPreferences] = useState(() => load(actor))
  const [soundReady, setSoundReady] = useState(false)
  const [batches, setBatches] = useState<NoticeBatch[]>([])
  const prefs = useRef(preferences), highWater = useRef<bigint | null>(null), preview = useRef(false)
  const sound = useRef<NotificationSound | null>(null)
  const getSound = () => sound.current ??= new NotificationSound(setSoundReady)
  const dismissAlert = useCallback((id?: string) => setBatches(rows => id ? rows.filter(row => row.notice.id !== id) : []), [])
  const resetAlerts = useCallback(() => {
    highWater.current = null; setBatches([]); sound.current?.dispose(); sound.current = null; setSoundReady(false)
  }, [])
  useEffect(() => () => { sound.current?.dispose(); sound.current = null }, [actor])
  const receive = useCallback((rows: Notice[]) => {
    const previous = highWater.current
    let maximum = previous ?? 0n
    const fresh = rows.filter(n => {
      const id = BigInt(n.id)
      if (id > maximum) maximum = id
      return previous !== null && id > previous && !n.read_at
    }).sort((a, b) => BigInt(a.id) > BigInt(b.id) ? -1 : 1)
    highWater.current = maximum
    if (!fresh.length) return
    if (prefs.current.popup && !preview.current) setBatches(rows => [...rows, {notice: fresh[0], extra: fresh.length - 1}])
    if (prefs.current.sound) sound.current?.play()
  }, [])
  function setPreference(key: keyof Preferences, enabled: boolean) {
    const next = {...prefs.current, [key]: enabled}
    prefs.current = next; setPreferences(next)
    try { if (actor) localStorage.setItem('hlf.notification-alerts.' + actor, JSON.stringify(next)) } catch { /* memory fallback */ }
    if (key === 'popup' && !enabled) dismissAlert()
    if (key === 'sound') {
      if (enabled) void getSound().activate()
      else sound.current?.stop()
    }
  }
  const alerts: NotificationAlerts = {preferences, soundReady, setPreference,
    activateSound: () => { if (prefs.current.sound) void getSound().activate() }, dismissAlert,
    setPreviewOpen: open => { preview.current = open; if (open) dismissAlert() }}
  return {alerts, batches, receive, resetAlerts}
}
