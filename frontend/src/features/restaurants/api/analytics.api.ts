import {request} from '../../../shared/api/request'
export type RevenueDay={date:string;completed_order_count:string;dish_revenue_vnd:string}
export type OwnerAnalytics={restaurant_id:string;timezone:string;days:number;from:string;to:string;as_of:string;daily:RevenueDay[];today:RevenueDay;totals:{completed_order_count:string;dish_revenue_vnd:string};top_dishes:{dish_id:string;dish_name_snapshot:string;quantity:string;dish_revenue_vnd:string}[]}
export const ownerAnalyticsApi=(actor:string,restaurant:string,days:7|30,signal:AbortSignal)=>request<OwnerAnalytics>(`/owner/restaurants/${restaurant}/analytics?days=${days}`,'GET',undefined,undefined,signal,actor)
