import {useEffect,useId,useRef,useState} from 'react'
import {OrderPage,type PaymentRenderer} from './OrderPage'
import type {Order,Payment} from './api'
import {Icon} from '../../shared/ui/Icon'
export function OwnerOrderDrawer({id,accountId,restricted,renderPayment,onClose,onChanged}:{id:string;accountId:string;restricted:boolean;renderPayment?:PaymentRenderer;onClose:()=>void;onChanged:(result?:Order|Payment)=>void}){
 const ref=useRef<HTMLDialogElement>(null),title=useId(),[busy,setBusy]=useState(false),closeRef=useRef(onClose),busyRef=useRef(false)
 useEffect(()=>{closeRef.current=onClose;busyRef.current=busy},[onClose,busy])
 useEffect(()=>{const d=ref.current!,previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';d.showModal();return()=>{d.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();else document.querySelector<HTMLElement>('.owner-orders h1')?.focus()}},[])
 function close(){if(busyRef.current)return;const reason=ref.current?.querySelector<HTMLTextAreaElement>('[name=reject_reason]')?.value;if(reason?.trim()&&!window.confirm('Bỏ lý do từ chối chưa gửi?'))return;closeRef.current()}
 return <dialog ref={ref} className="owner-order-drawer" aria-labelledby={title} onCancel={e=>{if(e.target!==e.currentTarget)return;e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget)close()}} onKeyDown={e=>{if(e.key!=='Tab'||(e.target as Element).closest('dialog')!==ref.current)return;const controls=Array.from(ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length&&!el.closest('dialog:not([open])'));const first=controls[0],last=controls.at(-1);if(!first){e.preventDefault();ref.current?.focus()}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}>
 <header className="order-drawer-heading"><div><span className="workspace-eyebrow">Đơn của quán</span><h2 id={title}>Chi tiết đơn hàng</h2></div><button className="order-close" aria-label="Đóng chi tiết đơn" disabled={busy} onClick={close}><Icon name="close"/></button></header>
 <div className="order-drawer-body"><OrderPage id={id} accountId={accountId} owner restricted={restricted} renderPayment={renderPayment} onChanged={onChanged} onBusy={setBusy}/></div>
 </dialog>
}
