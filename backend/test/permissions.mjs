import assert from 'node:assert/strict';
import mariadb from 'mariadb';
import { restrictedIdentities } from './db-permissions.mjs';
import { writeFile } from 'node:fs/promises';
const target = new URL(process.env.TEST_DATABASE_URL);
assert.ok(['127.0.0.1','localhost'].includes(target.hostname));
assert.match(target.pathname, /^\/test_[a-z0-9_]+$/);
const connect = url => { const u = new URL(url); return mariadb.createConnection({host:u.hostname,port:Number(u.port||3306),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),allowPublicKeyRetrieval:true}); };
const admin = await connect(target);
let runtime, provision;
try {
 assert.match((await admin.query('SELECT VERSION() AS v'))[0].v, /^9\.2\.0(?:[-.]|$)/);
 const identities = await restrictedIdentities(admin,target);
 runtime = await connect(identities.runtime); provision = await connect(identities.provision);
 const denied = async sql => assert.rejects(runtime.query(sql), e => [1142,1143].includes(e.errno));
 await runtime.query('SELECT * FROM admin_authority');
 await runtime.query("INSERT INTO accounts(login_identifier,password_hash,role,display_name) VALUES('permission_buyer','synthetic','student','Permission buyer')");
 const id = (await runtime.query("SELECT id FROM accounts WHERE login_identifier='permission_buyer'"))[0].id;
 await runtime.query("UPDATE accounts SET display_name='Updated',auth_version=auth_version+1 WHERE id=?",[id]);
 await denied(`INSERT INTO admin_authority(id,account_id) VALUES(1,${id})`);
 await denied(`UPDATE admin_authority SET account_id=${id} WHERE id=1`);
 await denied('DELETE FROM admin_authority WHERE id=1');
 await denied(`INSERT INTO admin_factors(account_id,encrypted_secret) VALUES(${id},'synthetic')`);
 await denied("UPDATE admin_factors SET encrypted_secret='replacement'");
 await denied("UPDATE accounts SET role='admin' WHERE id="+id);
 await denied('DELETE FROM accounts WHERE id='+id);
 await denied('DELETE FROM audit_logs');
 await denied("UPDATE audit_logs SET action='forged'");
 await denied('CREATE TABLE forbidden(id INT)');
 await denied('UPDATE restaurants SET owner_id=1');
 await provision.query('INSERT INTO admin_authority(id,account_id) VALUES(1,?)',[id]);
 await assert.rejects(provision.query('DELETE FROM admin_authority'), e=>e.errno===1142);
 await assert.rejects(provision.query('CREATE TABLE forbidden(id INT)'), e=>e.errno===1142);
 // Leave no authority for the separate browser fixture, which enrolls its own actor.
 await admin.query('DELETE FROM admin_authority WHERE account_id=?',[id]);
 if (process.env.PERMISSION_ENV_OUTPUT) await writeFile(process.env.PERMISSION_ENV_OUTPUT,
   `TEST_RUNTIME_DATABASE_URL=${identities.runtime}\n`,{mode:0o600});
 console.log('SEC-01 PASS: fresh runtime/provision users, runtime auth writes and authority reads allowed; authority/factor/role/history/DDL writes denied; provision authority insert allowed, delete/DDL denied.');
} finally {await runtime?.end();await provision?.end();await admin.end();}
