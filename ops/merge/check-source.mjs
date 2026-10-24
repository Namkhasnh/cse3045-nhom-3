// Read-only freshness check against the explicitly selected retained Mac source.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {snapshot,hash} from './snapshot.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const directory=process.argv[2];assert.match(directory??'',/^\/private\/tmp\/hlf-merge-[a-zA-Z0-9]+$/);
const input=JSON.parse(await readFile(directory+'/merge-input.json','utf8'));
process.loadEnvFile(new URL('../../backend/.env',import.meta.url));const u=new URL(process.env.DATABASE_URL);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'3307');assert.equal(u.pathname,'/hlf_dev_flow');
const c=await require('mariadb').createConnection({host:u.hostname,port:3307,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:'hlf_dev_flow',allowPublicKeyRetrieval:true,dateStrings:true,timezone:'Z',autoJsonMap:false});
try{await c.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');const current=await snapshot((s,v)=>c.query(s,v));
for(const n of ['admin_challenges','admin_factors','admin_mfa_limits','admin_operator_requests','admin_recovery_codes','auth_login_limits','ai_leases'])current.tables[n].rows=[];
current.tables.accounts.rows=current.tables.accounts.rows.map(({id,login_identifier,created_at})=>({id,login_identifier,created_at}));
assert.equal(hash(current),hash(input.source),'LOCAL_SOURCE_CHANGED_REBUILD_BACKUP_AND_MANIFEST');console.log(JSON.stringify({result:'PASS',stage:'local-source-freshness',source_sha256:hash(current)}));
}finally{await c.rollback();await c.end();}
