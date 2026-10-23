import {request} from '../../shared/api/request'
export type Recommendation={dish_id:string;restaurant_id:string;dish_name:string;restaurant_name:string;image_reference:string|null;quantity:1;unit_price_vnd:string;delivery_fee_vnd:string;estimated_total_vnd:string;reason:string}
export type RecommendationInput={pickup_point_id:string;budget_vnd:string;preferences:{category_ids:string[]}}
export const recommendationsApi={suggest:(actor:string,input:RecommendationInput,signal:AbortSignal)=>request<{suggestions:Recommendation[];generated_at:string}>('/ai/recommendations','POST',input,undefined,signal,actor)}
