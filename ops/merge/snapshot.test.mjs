import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,hash} from './snapshot.mjs';
test('MariaDB and Prisma metadata/scalars produce the same exact snapshot',async()=>{
 async function take(prisma){return snapshot(async sql=>{
  if(sql==='SELECT VERSION() v')return [{v:'9.2.0'}];
  if(sql.includes("TABLE_TYPE='BASE TABLE'"))return [{name:'fixture'}];
  if(sql.startsWith('SHOW FULL'))return [{Field:'id',Type:'bigint',Null:'NO',Extra:'auto_increment'},{Field:'version',Type:'int unsigned',Null:'NO',Extra:''},{Field:'rate',Type:'decimal(10,8)',Null:'NO',Extra:''},{Field:'created_at',Type:'datetime(3)',Null:'NO',Extra:'DEFAULT_GENERATED'},{Field:'derived',Type:'bigint',Null:'YES',Extra:'STORED GENERATED'}];
  if(sql.startsWith('SHOW INDEX'))return [{Key_name:'PRIMARY',Non_unique:prisma?0n:0,Seq_in_index:prisma?1n:1,Column_name:'id'}];
  if(sql.includes('KEY_COLUMN_USAGE'))return [];
  if(sql.startsWith('SHOW CREATE'))return [{'Create Table':'synthetic unchanged schema'}];
  return [{id:1n,version:prisma?2n:2,rate:prisma?'0.03':'0.03000000',created_at:prisma?new Date('2026-10-24T00:00:00.000Z'):'2026-10-24 00:00:00.000',derived:null}];
 });}
 const a=await take(false),b=await take(true);assert.equal(hash(a),hash(b));assert.equal(a.tables.fixture.columns.find(c=>c.name==='created_at').generated,false);assert.equal(a.tables.fixture.columns.find(c=>c.name==='derived').generated,true);
});
