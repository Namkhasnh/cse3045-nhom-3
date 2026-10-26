import type {Point, Rate} from './api'

export type DeliveryDraft = {pickup_point_id: string; km: string; fee: string; enabled: boolean}

// Parse decimal kilometres without floating-point multiplication or rounding.
export function kilometresToMetres(value: string): number | null {
  const match = /^(\d{1,4})(?:[.,](\d{1,3}))?$/.exec(value)
  if (!match) return null
  const metres = BigInt(match[1]) * 1000n + BigInt((match[2] ?? '').padEnd(3, '0'))
  return metres <= 1000000n ? Number(metres) : null
}

export function metresToKilometres(value: number): string {
  return `${Math.floor(value / 1000)}${value % 1000 ? '.' + String(value % 1000).padStart(3, '0').replace(/0+$/, '') : ''}`
}

export function draftErrors(draft: DeliveryDraft) {
  return {
    km: kilometresToMetres(draft.km) === null ? 'Nhập từ 0 đến 1.000 km, tối đa 3 chữ số thập phân.' : '',
    fee: !/^(0|[1-9]\d{0,8})$/.test(draft.fee) || BigInt(draft.fee) > 100000000n
      ? 'Nhập phí nguyên từ 0 đến 100.000.000 VND.' : '',
  }
}

export function draftsFromRates(rates: Rate[]): DeliveryDraft[] {
  return rates.map(rate => ({pickup_point_id: rate.pickup_point_id, km: metresToKilometres(rate.distance_m), fee: rate.delivery_fee_vnd, enabled: rate.is_enabled}))
}

export function availableDrafts(points: Point[], drafts: DeliveryDraft[]) {
  const active = new Set(points.filter(point => point.is_active).map(point => point.id))
  return drafts.filter(draft => active.has(draft.pickup_point_id))
}

export function draftPayload(drafts: DeliveryDraft[]): Rate[] {
  return drafts.map(draft => {
    const errors = draftErrors(draft), metres = kilometresToMetres(draft.km)
    if (errors.km || errors.fee || metres === null) throw new Error('Invalid delivery draft')
    return {pickup_point_id: draft.pickup_point_id, distance_m: metres, delivery_fee_vnd: draft.fee, is_enabled: draft.enabled}
  })
}

export function rateIsUsable(rate: Rate, points: Point[]) {
  return rate.is_enabled && rate.is_verified === true && points.some(point => point.id === rate.pickup_point_id && point.is_active)
}
