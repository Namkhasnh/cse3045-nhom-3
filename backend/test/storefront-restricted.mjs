import mariadb from 'mariadb';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {restrictedIdentities} from './db-permissions.mjs';
const target=new URL(process.env.TEST_DATABASE_URL);
if(!['127.0.0.1','localhost'].includes(target.hostname)||!/^test_/.test(target.pathname.slice(1)))throw new Error('Disposable local test DB required');
const connect=u=>mariadb.createConnection({host:u.hostname,port:Number(u.port||3306),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:true});
const operator=await connect(target);let runtime,identities;
try{identities=await restrictedIdentities(operator,target);runtime=await connect(new URL(identities.runtime));
 for(const sql of ["UPDATE restaurant_cover_media SET object_key='forged'","UPDATE restaurant_cover_media SET restaurant_id=1","DELETE FROM restaurant_cover_media","UPDATE restaurants SET owner_id=1"]){await assert.rejects(runtime.query(sql),e=>[1142,1143].includes(e.errno));}
 const result=spawnSync(process.execPath,['--test','.test-dist/test/integration/storefront.integration-spec.js'],{stdio:'inherit',env:{...process.env,DATABASE_URL:process.env.TEST_DATABASE_URL,TEST_RUNTIME_DATABASE_URL:identities.runtime}});assert.equal(result.status,0);console.log('PASS: least-privilege storefront HTTP writes and immutable asset identity');
}finally{await runtime?.end();if(identities){await operator.query('DROP USER '+identities.runtimeAccount);await operator.query('DROP USER '+identities.provisionAccount);}await operator.end();}
