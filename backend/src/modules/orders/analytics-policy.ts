import {invalid,object} from '../../common/http/input.js';
const DAY=86400000;
export function analyticsPeriod(raw:Record<string,unknown>,now=new Date()){
 const q=object(raw,['days'],[]);
 if(q.days!==undefined&&q.days!=='7'&&q.days!=='30')return invalid();
 const days=q.days==='30'?30:7;
 const today=new Date(Math.floor((now.getTime()+7*3600000)/DAY)*DAY-7*3600000);
 const from=new Date(today.getTime()-(days-1)*DAY),to=new Date(today.getTime()+DAY);
 const date=(at:Date)=>new Date(at.getTime()+7*3600000).toISOString().slice(0,10);
 return {days,from,to,asOf:now,dates:Array.from({length:days},(_,i)=>date(new Date(from.getTime()+i*DAY)))};
}
export type AnalyticsPeriod=ReturnType<typeof analyticsPeriod>;
export type DailyRevenue={date:string;completed_order_count:string;dish_revenue_vnd:string};
export function revenueSeries(dates:string[],rows:DailyRevenue[]){
 const byDate=new Map(rows.map(row=>[row.date,row]));
 const daily=dates.map(date=>byDate.get(date)??{date,completed_order_count:'0',dish_revenue_vnd:'0'});
 const sum=(field:'completed_order_count'|'dish_revenue_vnd')=>daily.reduce((n,row)=>n+BigInt(row[field]),0n).toString();
 return {daily,totals:{completed_order_count:sum('completed_order_count'),dish_revenue_vnd:sum('dish_revenue_vnd')},today:daily.at(-1)!};
}
