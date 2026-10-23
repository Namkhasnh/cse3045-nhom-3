export type PollEnvironment={visible:()=>boolean;online:()=>boolean;later:(fn:()=>void,ms:number)=>unknown;cancel:(id:unknown)=>void;subscribe:(fn:()=>void)=>()=>void}
export type PollStatus='refreshing'|'current'|'paused'|'error'
export const browserPollEnvironment:PollEnvironment={visible:()=>document.visibilityState==='visible',online:()=>navigator.onLine,later:(fn,ms)=>window.setTimeout(fn,ms),cancel:id=>window.clearTimeout(id as number),subscribe:fn=>{document.addEventListener('visibilitychange',fn);window.addEventListener('online',fn);window.addEventListener('offline',fn);return()=>{document.removeEventListener('visibilitychange',fn);window.removeEventListener('online',fn);window.removeEventListener('offline',fn)}}}
export function startPolling(task:(signal:AbortSignal)=>Promise<void>,options:{enabled?:()=>boolean;state?:(state:PollStatus)=>void;env?:PollEnvironment}={}){
 const env=options.env??browserPollEnvironment;let stopped=false,running=false,again=false,forceNext=false,timer:unknown,abort:AbortController|undefined,failures=0
 const active=()=>env.visible()&&env.online(),enabled=()=>options.enabled?.()??true
 const cancel=()=>{if(timer!==undefined){env.cancel(timer);timer=undefined}}
 async function run(){cancel();if(stopped)return;if(!active()){options.state?.('paused');return}if(running){again=true;return}if(!forceNext&&!enabled()){options.state?.('current');return}forceNext=false;again=false;running=true;abort=new AbortController();const current=abort;options.state?.('refreshing')
 try{await task(current.signal);if(!stopped&&!current.signal.aborted){failures=0;options.state?.('current')}}catch{if(!stopped&&!current.signal.aborted){failures++;options.state?.('error')}}finally{running=false;if(!stopped){if(!active())options.state?.('paused');else if(again){again=false;timer=env.later(()=>void run(),0)}else if(enabled())timer=env.later(()=>void run(),Math.min(5000*2**Math.max(0,failures-1),30000))}}
 }
 const unsubscribe=env.subscribe(()=>{cancel();if(!active()){abort?.abort();options.state?.('paused')}else {again=true;void run()}})
 void run()
 return {refresh:()=>{forceNext=true;again=true;void run()},stop:()=>{stopped=true;cancel();abort?.abort();unsubscribe()}}
}
