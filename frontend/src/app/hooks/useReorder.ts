import {useEffect,useRef} from 'react'
import {ordersApi} from '../../features/orders'
import {catalogApi} from '../../features/restaurants'
import {useCart} from '../../features/cart'
import {showFeedback} from '../../shared/lib/feedback'
export function useReorder(accountId:string){
 const cart=useCart(),inflight=useRef(false),active=useRef(accountId)
 useEffect(()=>{active.current=accountId;return()=>{active.current=''}},[accountId])
 return async(id:string)=>{if(inflight.current)return;inflight.current=true;try{const order=await ordersApi.read(id,undefined,accountId);if(!['completed','cancelled','rejected'].includes(order.status))throw new Error('Chỉ đặt lại đơn đã kết thúc.');const restaurant=await catalogApi.restaurant(order.restaurant_id);if(!restaurant.is_active||!restaurant.is_open||!restaurant.is_accepting_orders)throw new Error('Quán hiện không nhận đơn. Giỏ hàng được giữ nguyên.');const rows=await Promise.all(order.items.map(async item=>{try{const dish=await catalogApi.dish(item.dish_id);return dish.restaurant_id===restaurant.id&&dish.is_available?{item,dish}: {item,dish:null}}catch{return {item,dish:null}}}));const eligible=rows.filter((r):r is typeof r&{dish:NonNullable<typeof r.dish>}=>!!r.dish),skipped=rows.filter(r=>!r.dish).map(r=>r.item.dish_name_snapshot);if(active.current!==accountId)return;if(!eligible.length)throw new Error('Không có món còn bán hoặc chưa kiểm tra được món. Giỏ được giữ nguyên.');if(!cart.addMany(restaurant,eligible.map(r=>({dish:r.dish,quantity:r.item.quantity}))))throw new Error('Chưa thêm được món. Hãy kiểm tra giới hạn giỏ.');if(skipped.length)showFeedback('Chưa thêm được: '+skipped.join(', ')+'. Món hết/ẩn hoặc chưa kiểm tra được.','error');showFeedback('Vào giỏ hàng để tick món và đặt đơn.','success')}finally{inflight.current=false}}
}
