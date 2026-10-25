import {useEffect,useRef,useState} from 'react'
export function useSettingsDraft<T>(initial:T){const [value,setValue]=useState(initial),baseline=useRef(initial)
 useEffect(()=>{const old=baseline.current;setValue(current=>JSON.stringify(current)===JSON.stringify(old)?initial:current);baseline.current=initial},[initial])
 return {value,setValue,dirty:JSON.stringify(value)!==JSON.stringify(initial),reset:()=>setValue(initial)}
}
export function useLeaveWarning(dirty:boolean){useEffect(()=>{if(!dirty)return
 let approved=false
 const confirm=()=>window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và rời trang?')
 const unload=(e:BeforeUnloadEvent)=>{if(!approved){e.preventDefault();e.returnValue=''}}
 const click=(e:MouseEvent)=>{const a=e.target instanceof Element?e.target.closest('a'):null;if(!a||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;const u=new URL(a.href);if(u.pathname===location.pathname&&u.search===location.search)return;if(!confirm()){e.preventDefault();e.stopImmediatePropagation()}else{approved=true;window.setTimeout(()=>{approved=false},0)}}
 const navigation=(e:Event)=>{if(approved){approved=false;return}if(!confirm())e.preventDefault()}
 window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);window.addEventListener('hlf:before-navigation',navigation)
 return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);window.removeEventListener('hlf:before-navigation',navigation)}
 },[dirty])}
