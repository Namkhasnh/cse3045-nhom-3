import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import {Button} from '../../shared/ui/Button'
import {Icon,type IconName} from '../../shared/ui/Icon'
import {formatVnd} from '../../shared/lib/format'
import {localMonth,monthBoundary,monthLabel,type Report,type Entry,type Row,type Receipt,type Page,type Statement} from './finance-api'
import {useOwnerFinanceRead} from './use-owner-finance-read'
import {entryKind,periodStatus,reportRevenue} from './owner-finance-model'
import './owner-finance.css'

const dateTime=(value:string)=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})
type Detail={kind:'period';row:Row}|{kind:'entry';entry:Entry}

export function OwnerFinancePage({actor,restaurant}:{actor:string;restaurant:string}){
 const [initial]=useState(()=>{const to=localMonth(new Date());return {from:localMonth(new Date(Date.parse(monthBoundary(to))-1)),to}})
 const [from,setFrom]=useState(initial.from),[to,setTo]=useState(initial.to),[range,setRange]=useState(initial)
 const [revision,setRevision]=useState(0),[validation,setValidation]=useState(''),[periodSearch,setPeriodSearch]=useState(''),[periodPage,setPeriodPage]=useState(0)
 const [code,setCode]=useState(''),[month,setMonth]=useState(''),[assigned,setAssigned]=useState(''),[filters,setFilters]=useState<Record<string,string>>({})
 const [entryCursors,setEntryCursors]=useState<string[]>(['']),[detail,setDetail]=useState<Detail|null>(null)
 const report=useOwnerFinanceRead<Report>(actor,'/reports/commissions?'+new URLSearchParams({restaurant_id:restaurant,from:monthBoundary(range.from),to:monthBoundary(range.to,true)}),revision,true)
 const entryCursor=entryCursors.at(-1)!
 const entries=useOwnerFinanceRead<Page<Entry>>(actor,'/commission-entries?'+new URLSearchParams({restaurant_id:restaurant,...filters,...(entryCursor?{cursor:entryCursor}:{})}),revision)
 const rows=report.data?.data??[],periods=rows.filter(row=>monthLabel(row.period_start_at).includes(periodSearch.trim()))
 const visiblePeriods=periods.slice(periodPage*12,periodPage*12+12)
 function refresh(){setDetail(null);setEntryCursors(['']);setRevision(n=>n+1)}
 function applyRange(){
  try{
   monthBoundary(from);monthBoundary(to)
   const [fy,fm]=from.split('-').map(Number),[ty,tm]=to.split('-').map(Number),count=(ty-fy)*12+tm-fm+1
   if(count<1||count>120)throw new Error()
   setRange({from,to});setValidation('');setPeriodPage(0);setDetail(null);setRevision(n=>n+1);return true
  }catch{setValidation('Chọn khoảng tháng hợp lệ, tối đa 120 tháng.');return false}
 }
 return <section className="owner-finance" aria-labelledby="owner-finance-title">
  <header className="of-heading">
   <div><span className="of-eyebrow">Tài chính quán</span><h1 id="owner-finance-title">Công nợ và báo cáo</h1><p>Theo dõi doanh thu, hoa hồng và tình trạng đối soát của quán.</p></div>
   <form className="of-toolbar" aria-label="Khoảng báo cáo" noValidate onSubmit={e=>{e.preventDefault();const valid=applyRange(),picker=e.currentTarget.querySelector('details');if(picker)picker.open=!valid;if(!valid)e.currentTarget.querySelector('input')?.focus()}}>
    <details className="of-range"><summary><Icon name="clock"/><span><small>Kỳ báo cáo</small><strong>{monthLabel(monthBoundary(range.from))} – {monthLabel(monthBoundary(range.to))}</strong></span><Icon name="chevron"/></summary>
     <div className="of-range-fields"><label>Từ tháng<input name="from_month" type="month" min="2000-01" max="2099-12" required value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Đến tháng<input name="to_month" type="month" min="2000-01" max="2099-12" required value={to} onChange={e=>setTo(e.target.value)}/></label><p>Giờ Việt Nam · tối đa 120 tháng</p></div>
    </details>
    <Button variant="neutral" onClick={refresh} disabled={report.loading||entries.loading}><Icon name="reset"/>Cập nhật công nợ</Button><Button type="submit">Xem báo cáo</Button>
   </form>
  </header>
  {validation&&<p role="alert" className="of-alert">{validation}</p>}
  <p className="of-sync"><Icon name="reset"/>{report.data?'Chốt số liệu tại '+dateTime(report.data.page.as_of):'Số liệu sẽ hiển thị sau khi tải từ hệ thống.'}</p>
  <ReadState loading={report.loading} error={report.error} stale={Boolean(report.data)} onRetry={refresh} label="báo cáo"/>
  <div className="of-kpis" aria-label="Tổng quan tài chính" aria-busy={report.loading}>
   <Metric title="Doanh thu món ăn" icon="orders" value={report.data?reportRevenue(rows):null} note={`Tiền món đơn hoàn thành · ${monthLabel(monthBoundary(range.from))} – ${monthLabel(monthBoundary(range.to))}`}/>
   <Metric title="Phải thu toàn quán" icon="briefcase" value={report.data?.summary.account_receivable_vnd??null} note="Hoa hồng sau điều chỉnh và bù voucher · mọi kỳ"/>
   <Metric title="Đã thu sau đảo" icon="check" value={report.data?.summary.account_collected_vnd??null} note="Khoản thu đã ghi nhận, trừ các bản đảo · mọi kỳ"/>
   <Metric title="Công nợ còn lại" icon="wallet" value={report.data?.summary.account_outstanding_vnd??null} note="Dư nợ có dấu toàn quán · số âm được giữ để bù trừ" accent/>
  </div>
  <details className="of-explainer">
   <summary><span className="of-icon"><Icon name="help"/></span><span><strong>Hoa hồng được tính như thế nào?</strong><small>Minh bạch từ giá trị đơn đến số tiền cần đối soát.</small></span><span className="of-link">Xem cách tính <Icon name="chevron"/></span></summary>
   <ol>{['Tiền món đơn hoàn thành','Tỷ lệ áp dụng của đơn','Hoa hồng cơ bản','Điều chỉnh và bù voucher','Phải thu sau bù trừ'].map(step=><li key={step}>{step}</li>)}</ol>
   <p>Hoa hồng được tính từ tiền món và tỷ lệ đã lưu khi đặt đơn, không gồm phí giao hàng; làm tròn một lần cho mỗi đơn. Bút toán điều chỉnh và bù voucher được ghi riêng. Công nợ bằng phải thu trừ tiền đã ghi thu sau đảo.</p><p>Số dư toàn quán gồm cả khoản chưa gán bảng. Dư từng kỳ không cộng lặp tín dụng. Đảo sổ không đồng nghĩa với chuyển tiền hoàn.</p>
  </details>
  <section className="of-section" aria-labelledby="of-periods-title">
   <div className="of-section-head"><div><h2 id="of-periods-title">Báo cáo theo kỳ</h2><p>Tổng hợp doanh thu món và công nợ theo từng kỳ đối soát.</p></div><label className="of-search"><span>Tìm kỳ báo cáo</span><span className="of-input-icon"><Icon name="search"/><input type="search" placeholder="VD: 10/2026" value={periodSearch} onChange={e=>{setPeriodSearch(e.target.value);setPeriodPage(0)}}/></span></label></div>
   {report.data&&<>
    <div className="of-table" role="region" aria-label="Báo cáo công nợ theo tháng" tabIndex={0}><table><caption className="of-sr">Công nợ và doanh thu món theo tháng</caption><thead><tr>{['Kỳ báo cáo','Đơn hoàn thành','Doanh thu món','Hoa hồng','Điều chỉnh','Đã thu','Dư kỳ','Trạng thái','Chi tiết'].map(t=><th scope="col" key={t}>{t}</th>)}</tr></thead><tbody>
     {visiblePeriods.map(row=><tr key={row.period_start_at}><th scope="row">{monthLabel(row.period_start_at)}<small>{row.entry_count} bút toán</small></th><td data-label="Đơn hoàn thành">{row.completed_order_count} đơn</td><MoneyCell label="Doanh thu món" value={row.dish_revenue_vnd}/><MoneyCell label="Hoa hồng" value={row.base_vnd}/><MoneyCell label="Điều chỉnh" value={row.adjustment_vnd}/><MoneyCell label="Đã thu" value={row.collected_vnd}/><MoneyCell label="Dư kỳ" value={row.outstanding_vnd} accent/><td data-label="Trạng thái"><PeriodBadge row={row}/></td><td><Button variant="neutral" className="of-detail-button" data-settlement-id={row.settlement_id??undefined} aria-label={'Xem chi tiết kỳ '+monthLabel(row.period_start_at)} onClick={()=>setDetail({kind:'period',row})}>Xem chi tiết<Icon name="chevron"/></Button></td></tr>)}
    </tbody></table></div>
    {!periods.length&&<Empty text={periodSearch?'Không có kỳ phù hợp với tìm kiếm.':'Kỳ báo cáo chưa có phát sinh.'}/>}
    {rows.length>0&&!rows.some(row=>row.completed_order_count||row.entry_count>0)&&<p className="of-note">Kỳ báo cáo chưa có phát sinh.</p>}
    {periods.length>12&&<div className="of-pagination"><span>{periodPage*12+1}–{Math.min((periodPage+1)*12,periods.length)} / {periods.length} kỳ</span><Button variant="neutral" disabled={!periodPage} onClick={()=>setPeriodPage(n=>n-1)}>Trước</Button><Button variant="neutral" disabled={(periodPage+1)*12>=periods.length} onClick={()=>setPeriodPage(n=>n+1)}>Sau</Button></div>}
   </>}
  </section>
  <section className="of-section" aria-labelledby="of-ledger-title">
   <div className="of-section-head"><div><h2 id="of-ledger-title">Chi tiết hoa hồng theo đơn</h2><p>Sổ hoa hồng · kiểm tra nguồn gốc từng bút toán.</p></div><span className="of-count">{entries.data?entries.data.data.length+' bản ghi trên trang':'Đang tải sổ'}</span></div>
   <form className="of-filters" aria-label="Lọc sổ hoa hồng" onSubmit={e=>{e.preventDefault();setEntryCursors(['']);setDetail(null);setFilters({...code.trim()?{order_code:code.trim().toUpperCase()}:{},...month?{period_start_at:monthBoundary(month)}:{},...assigned?{assigned}:{}})}}>
    <label className="of-search"><span>Mã đơn đầy đủ</span><span className="of-input-icon"><Icon name="search"/><input type="search" placeholder="HLF-XXXXXXXX" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} pattern="HLF-[2-9A-HJ-NP-Z]{8}" maxLength={12}/></span></label>
    <label>Tháng ghi sổ<input type="month" value={month} min="2000-01" max="2099-12" onChange={e=>setMonth(e.target.value)}/></label>
    <label>Gán bảng đối soát<select value={assigned} onChange={e=>setAssigned(e.target.value)}><option value="">Tất cả bút toán</option><option value="false">Chưa gán bảng</option><option value="true">Đã gán bảng</option></select></label>
    <Button variant="neutral" type="submit">Áp dụng</Button><Button variant="neutral" className="of-clear" onClick={()=>{setCode('');setMonth('');setAssigned('');setFilters({});setEntryCursors(['']);setDetail(null)}}>Xóa bộ lọc</Button>
   </form>
   <ReadState loading={entries.loading} error={entries.error} stale={Boolean(entries.data)} onRetry={refresh} label="sổ hoa hồng"/>
   {entries.data&&<><div className="of-table" role="region" aria-label="Sổ hoa hồng theo đơn" tabIndex={0}><table><caption className="of-sr">Bút toán hoa hồng theo đơn</caption><thead><tr>{['Mã đơn','Loại bút toán','Số tiền','Kỳ ghi sổ','Gán bảng đối soát','Chi tiết'].map(t=><th scope="col" key={t}>{t}</th>)}</tr></thead><tbody>{entries.data.data.map(entry=><tr key={entry.id}><th scope="row">{entry.order_code}<small>Bút toán #{entry.id}</small></th><td data-label="Loại bút toán">{entryKind(entry)}</td><MoneyCell label="Số tiền" value={entry.amount_vnd}/><td data-label="Kỳ ghi sổ">{monthLabel(entry.booking_month)}</td><td data-label="Gán bảng đối soát"><span className={'of-badge '+(entry.settlement_id?'of-badge-credit':'of-badge-warning')}>{entry.settlement_id?'Bảng #'+entry.settlement_id:'Chưa gán bảng'}</span></td><td><Button variant="neutral" className="of-detail-button" aria-label={'Xem bút toán '+entry.id} onClick={()=>setDetail({kind:'entry',entry})}>Xem chi tiết<Icon name="chevron"/></Button></td></tr>)}</tbody></table></div>
    {!entries.data.data.length&&<Empty text={Object.keys(filters).length?'Không có bút toán phù hợp.':'Chưa có bút toán.'}/>}
    <div className="of-pagination"><span>Trang {entryCursors.length} · {entries.data.data.length} bản ghi</span><Button variant="neutral" disabled={entryCursors.length===1||entries.loading} onClick={()=>setEntryCursors(c=>c.slice(0,-1))}>Trước</Button><Button variant="neutral" disabled={!entries.data.page.has_more||!entries.data.page.next_cursor||entries.loading} onClick={()=>setEntryCursors(c=>[...c,entries.data!.page.next_cursor!])}>Sau</Button></div>
   </>}
  </section>
  <details className="of-activity"><summary><span><strong>Phí giao và hoạt động ghi thu</strong><small>Phí giao hàng được theo dõi riêng, không thuộc cơ sở tính hoa hồng.</small></span><Icon name="chevron"/></summary>
   {report.data?rows.map(row=><article key={row.period_start_at}><h3>{monthLabel(row.period_start_at)}</h3><Facts values={[["Phí giao",row.delivery_fee_vnd],["Tổng đơn",row.order_total_vnd],["Ghi thu",row.gross_receipts_vnd],["Đảo sổ",row.receipt_reversals_vnd],["Hoạt động ròng",row.net_recorded_collection_vnd]]}/></article>):<p>Chưa có dữ liệu báo cáo.</p>}
   <p>Doanh thu theo lúc hoàn thành; ghi thu theo lúc thực nhận; bản đảo theo lúc ghi sổ. Đảo sổ không chứng minh đã hoàn tiền.</p>
  </details>
  {detail&&((detail.kind==='period'&&report.data)||(detail.kind==='entry'&&entries.data))&&<FinanceDrawer key={detail.kind==='period'?detail.row.period_start_at:detail.entry.id} title={detail.kind==='period'?'Kỳ '+monthLabel(detail.row.period_start_at):'Đơn '+detail.entry.order_code} eyebrow={detail.kind==='period'?'Chi tiết kỳ báo cáo':'Chi tiết bút toán'} onClose={()=>setDetail(null)}>
   {detail.kind==='period'?<><PeriodBadge row={detail.row}/><h3>Tổng hợp kỳ</h3><Facts values={[["Tiền món",detail.row.dish_revenue_vnd],["Hoa hồng cơ bản",detail.row.base_vnd],["Điều chỉnh",detail.row.adjustment_vnd],["Bù voucher",detail.row.subsidy_vnd??'0'],["Phải thu",detail.row.receivable_vnd],["Đã thu sau đảo",detail.row.collected_vnd],["Dư kỳ",detail.row.outstanding_vnd]]}/><p>{detail.row.completed_order_count} đơn hoàn thành · {detail.row.entry_count} bút toán</p><p>Chốt số liệu tại {dateTime(detail.row.as_of)}. Dư âm được giữ để bù trừ.</p>{detail.row.settlement_id?<SettlementHistory actor={actor} id={detail.row.settlement_id}/>:<p className="of-note">Kỳ chưa có bảng đối soát. Chỉ Admin được chốt kỳ và ghi nhận khoản thu.</p>}</>:<><span className="of-badge of-badge-neutral">{entryKind(detail.entry)}</span><h3>Bút toán #{detail.entry.id}</h3><Facts values={[["Số tiền",detail.entry.amount_vnd]]}/><dl className="of-facts"><div><dt>Kỳ ghi sổ</dt><dd>{monthLabel(detail.entry.booking_month)}</dd></div><div><dt>Bảng đối soát</dt><dd>{detail.entry.settlement_id?'#'+detail.entry.settlement_id:'Chưa gán bảng'}</dd></div><div><dt>Ngày hoàn thành</dt><dd>Chưa có dữ liệu</dd></div><div><dt>Tiền món của đơn</dt><dd>Chưa có dữ liệu</dd></div></dl>{detail.entry.reason&&<p>Lý do: {detail.entry.reason}</p>}{detail.entry.corrects_entry_id&&<p>Sửa bút toán #{detail.entry.corrects_entry_id}</p>}<p className="of-note">Số tiền trên là bút toán đã ghi nhận. Không suy ra tiền món hoặc tỷ lệ từ số hoa hồng.</p>{detail.entry.settlement_id&&<SettlementHistory actor={actor} id={detail.entry.settlement_id}/>}</>}
  </FinanceDrawer>}
 </section>
}

function Metric({title,icon,value,note,accent=false}:{title:string;icon:IconName;value:string|null;note:string;accent?:boolean}){
 return <article className={'of-metric'+(accent?' of-metric-accent':'')}><span className="of-icon"><Icon name={icon}/></span><h2>{title}</h2><strong>{value===null?'—':formatVnd(value)}</strong><p>{note}</p></article>
}
function MoneyCell({label,value,accent=false}:{label:string;value:string;accent?:boolean}){return <td data-label={label} className={'of-money'+(accent?' of-money-accent':'')}>{formatVnd(value)}</td>}
function PeriodBadge({row}:{row:Row}){const status=periodStatus(row);return <span className={'of-badge of-badge-'+status.tone}>{status.label}</span>}
function Facts({values}:{values:[string,string][]}){return <dl className="of-facts">{values.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{formatVnd(value)}</dd></div>)}</dl>}
function Empty({text}:{text:string}){return <div className="of-empty"><Icon name="inbox"/><p>{text}</p></div>}
function ReadState({loading,error,stale,onRetry,label}:{loading:boolean;error:string;stale:boolean;onRetry():void;label:string}){
 return <>{loading&&<p className="of-note" role="status">{stale?'Đang cập nhật ':'Đang tải '}{label}…</p>}{error&&<div className="of-alert" role="alert"><p>{error}{stale?' Số liệu cũ có thể chưa cập nhật.':''}</p><Button variant="neutral" onClick={onRetry}>Thử lại</Button></div>}</>
}
function FinanceDrawer({title,eyebrow,onClose,children}:{title:string;eyebrow:string;onClose():void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),id=useId()
 useEffect(()=>{const dialog=ref.current!,previous=document.activeElement instanceof HTMLElement?document.activeElement:null,overflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=overflow;previous?.focus()}},[])
 return <dialog ref={ref} className="of-drawer" aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}} onKeyDown={e=>{
  if(e.key!=='Tab')return
  const controls=Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]')).filter(el=>el.getClientRects().length)
  const first=controls[0],last=controls.at(-1)
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 }}><header><div><span className="of-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2></div><Button autoFocus variant="neutral" aria-label="Đóng chi tiết" onClick={onClose}><Icon name="close"/></Button></header><div className="of-drawer-body">{children}</div><footer><Button variant="neutral" onClick={onClose}>Đóng</Button></footer></dialog>
}
function SettlementHistory({actor,id}:{actor:string;id:string}){
 const [revision,setRevision]=useState(0),[cursors,setCursors]=useState([''])
 const statement=useOwnerFinanceRead<Statement>(actor,'/settlements/'+id,revision)
 const receipts=useOwnerFinanceRead<Page<Receipt>>(actor,'/settlements/'+id+'/receipts'+(cursors.at(-1)?'?cursor='+encodeURIComponent(cursors.at(-1)!):''),revision)
 const retry=()=>{setCursors(['']);setRevision(n=>n+1)}
 return <section className="of-receipts" aria-label={'Bảng đối soát '+id}><h3>Bảng đối soát #{id}</h3><ReadState loading={statement.loading} error={statement.error} stale={Boolean(statement.data)} onRetry={retry} label="bảng đối soát"/>
  {statement.data&&<><Facts values={[["Dư kỳ hiện tại",statement.data.outstanding_vnd],["Được thu tối đa sau bù trừ",statement.data.collectible_vnd]]}/><p>Bảng lập ngày {dateTime(statement.data.created_at)}. Số dư hiện tại có thể khác báo cáo tại mốc chốt dữ liệu.</p></>}
  <h3>Lịch sử biên nhận và bản đảo</h3><ReadState loading={receipts.loading} error={receipts.error} stale={Boolean(receipts.data)} onRetry={retry} label="biên nhận"/>
  {receipts.data?.data.map(p=><article key={p.id}><strong>Biên nhận #{p.id} · {formatVnd(p.amount_vnd)}</strong><p>{p.method==='cash'?'Tiền mặt':'Chuyển khoản'} · {p.reference}</p><p>Thực nhận: {dateTime(p.received_at)}</p>{p.note&&<p>{p.note}</p>}{p.replaces_receipt_id&&<p>Thay thế biên nhận #{p.replaces_receipt_id} đã đảo.</p>}{p.reversal&&<p className="of-note">Đã đảo toàn bộ · {p.reversal.reason}. Bản đảo không chứng minh đã hoàn tiền.</p>}</article>)}
  {receipts.data&&!receipts.data.data.length&&<p>Chưa có biên nhận trong bảng này.</p>}
  {receipts.data&&<div className="of-pagination"><span>Trang {cursors.length}</span><Button variant="neutral" disabled={cursors.length===1||receipts.loading} onClick={()=>setCursors(c=>c.slice(0,-1))}>Trước</Button><Button variant="neutral" disabled={!receipts.data.page.has_more||!receipts.data.page.next_cursor||receipts.loading} onClick={()=>setCursors(c=>[...c,receipts.data!.page.next_cursor!])}>Sau</Button></div>}
 </section>
}
