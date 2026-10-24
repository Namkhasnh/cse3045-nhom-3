import type {Point,Rate} from './api'

// Historical policy rows remain readable, but unavailable points cannot enter a new proposal.
export function ratesForActivePoints(points: Pick<Point,'id'|'is_active'>[], rates: Rate[]): Rate[] {
 const active = new Set(points.filter(point=>point.is_active).map(point=>point.id))
 return rates.filter(rate=>active.has(rate.pickup_point_id))
}
