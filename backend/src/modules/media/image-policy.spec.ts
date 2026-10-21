import {test} from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {imageInput} from './image-policy.js';
test('CRUD-01 image decoding strips EXIF; spoofed MIME/corrupt/oversized/unsupported inputs rejected',async()=>{
 const source=await sharp({create:{width:10,height:10,channels:3,background:'red'}}).withMetadata({exif:{IFD0:{Artist:'Synthetic private metadata'}}}).jpeg().toBuffer();
 const result=await imageInput({mime_type:'image/jpeg',content_base64:source.toString('base64')});const meta=await sharp(result.bytes).metadata();assert.equal(meta.exif,undefined);assert.equal(meta.width,10);
 for(const b of [{mime_type:'image/png',content_base64:source.toString('base64')},{mime_type:'image/svg+xml',content_base64:Buffer.from('<svg/>').toString('base64')},{mime_type:'image/jpeg',content_base64:source.subarray(0,30).toString('base64')},{mime_type:'image/jpeg',content_base64:Buffer.alloc(5242881).toString('base64')}])await assert.rejects(imageInput(b));
 const wide=await sharp({create:{width:4097,height:1,channels:3,background:'red'}}).png().toBuffer();await assert.rejects(imageInput({mime_type:'image/png',content_base64:wide.toString('base64')}));
 const pixels=await sharp({create:{width:4096,height:4096,channels:3,background:'red'}}).png().toBuffer();await assert.rejects(imageInput({mime_type:'image/png',content_base64:pixels.toString('base64')}));
});
