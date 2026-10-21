import type {Order,Payment,Summary} from './api'
export const terminal=(status:string)=>['completed','cancelled','rejected'].includes(status)
export function mergePayment(current:Payment|null,incoming:Payment|null){if(!current)return incoming;if(!incoming)return current;return incoming.order_id===current.order_id&&incoming.version>=current.version?incoming:current}
export function mergeOrder<T extends Summary>(current:T|null,incoming:T):T{if(!current)return incoming;if(current.id!==incoming.id)return current;const next=incoming.version>=current.version?incoming:current;return {...next,payment:mergePayment(current.payment,incoming.payment)}}
export function paymentOnly(current:Order,incoming:Payment):Order{return {...current,payment:mergePayment(current.payment,incoming)}}
