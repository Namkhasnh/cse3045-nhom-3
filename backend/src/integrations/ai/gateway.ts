import type {Projection} from '../../modules/recommendations/policy.js';
export type AiResponse={text:string;inputTokens:number|null;outputTokens:number|null};
// Provider-neutral port. No catalog authority, writes, tools or transcript persistence.
export abstract class AiGateway {
 abstract inputBytes(candidates:Projection[]):number;
 abstract generate(candidates:Projection[],signal:AbortSignal):Promise<AiResponse>;
}
