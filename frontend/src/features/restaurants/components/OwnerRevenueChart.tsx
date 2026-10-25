import {useEffect,useRef,useState} from 'react'
import {formatVnd} from '../../../shared/lib/format'
import type {OwnerAnalytics} from '../api/analytics.api'
export function OwnerRevenueChart({data}:{data:OwnerAnalytics}){
 const [selected,setSelected]=useState<string|null>(null),bars=useRef<HTMLDivElement>(null)
 useEffect(()=>{bars.current?.scrollTo({left:bars.current.scrollWidth,behavior:'instant'})},[data.from,data.to])
 const max=data.daily.reduce((n,d)=>BigInt(d.dish_revenue_vnd)>n?BigInt(d.dish_revenue_vnd):n,0n)
 const chosen=data.daily.find(d=>d.date===selected)
 return <><strong className="owner-revenue-total">{formatVnd(data.totals.dish_revenue_vnd)}</strong><p>{data.from.split('-').reverse().join('/')} – {data.to.split('-').reverse().join('/')} · Giờ Việt Nam</p>
 {max===0n?<p className="owner-empty">Chưa có đơn hoàn tất trong khoảng này.</p>:<><div ref={bars} className="owner-revenue-bars" aria-label="Biểu đồ doanh thu tiền món theo ngày">{data.daily.map(d=>{
  // Convert only the bounded integer pixel height; raw VND always stays BigInt/string.
  const height=Number(BigInt(d.dish_revenue_vnd)*160n/max)
  return <button key={d.date} type="button" aria-pressed={selected===d.date} aria-label={`${d.date.split('-').reverse().join('/')}: ${formatVnd(d.dish_revenue_vnd)}, ${d.completed_order_count} đơn hoàn tất`} onFocus={()=>setSelected(d.date)} onMouseEnter={()=>setSelected(d.date)} onClick={()=>setSelected(d.date)}><span className="owner-revenue-bar-track"><span className="owner-revenue-bar" style={{height:(d.dish_revenue_vnd==='0'?0:Math.max(height,2))+'px'}}/></span><small>{d.date.slice(8)}</small></button>
 })}</div><p className="owner-chart-tooltip" role="status">{chosen?`${chosen.date.split('-').reverse().join('/')}: ${formatVnd(chosen.dish_revenue_vnd)} · ${chosen.completed_order_count} đơn hoàn tất`:'Chọn một ngày để xem doanh thu.'}</p></>}
 <details className="owner-revenue-table"><summary>Xem số liệu từng ngày</summary><div><table><caption>Doanh thu tiền món, không gồm phí giao</caption><thead><tr><th scope="col">Ngày</th><th scope="col">Đơn hoàn tất</th><th scope="col">Doanh thu</th></tr></thead><tbody>{data.daily.map(d=><tr key={d.date}><th scope="row">{d.date.split('-').reverse().join('/')}</th><td>{d.completed_order_count}</td><td>{formatVnd(d.dish_revenue_vnd)}</td></tr>)}</tbody></table></div></details>
 </>
}
