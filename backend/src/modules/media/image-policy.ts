import sharp from 'sharp';
import {invalid,object} from '../../common/http/input.js';
export async function imageInput(raw:unknown){const b=object(raw,['mime_type','content_base64']);
 if(typeof b.content_base64!=='string'||b.content_base64.length>6990508||b.content_base64.length%4!==0||/[^A-Za-z0-9+/=]/.test(b.content_base64))return invalid();
 const estimated=b.content_base64.length/4*3-(b.content_base64.endsWith('==')?2:b.content_base64.endsWith('=')?1:0);if(estimated>5242880)return invalid();
 const bytes=Buffer.from(b.content_base64,'base64');if(!bytes.length||bytes.length>5242880||bytes.toString('base64')!==b.content_base64)return invalid();
 // Reject unsupported formats before decoder dispatch, including SVG/PDF/WebP.
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if((!png&&!jpeg)||b.mime_type!==(png?'image/png':'image/jpeg'))return invalid();
 try{const image=sharp(bytes,{limitInputPixels:16000000,failOn:'warning'}),meta=await image.metadata();if(!meta.width||!meta.height||meta.width>4096||meta.height>4096||meta.width*meta.height>16000000||(meta.pages??1)!==1)return invalid();
 const result=await (png?image.rotate().png():image.rotate().jpeg({quality:90})).toBuffer({resolveWithObject:true});if(result.data.length>5242880)return invalid();
 return {bytes:result.data,mime:png?'image/png':'image/jpeg',width:result.info.width,height:result.info.height};}catch{return invalid();}
}
