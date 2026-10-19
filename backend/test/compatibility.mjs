// Runs the actual previous backend revision, not a reimplementation of its reads.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import mariadb from 'mariadb';
import { hashPassword } from '../dist/modules/accounts/password-hash.js';
const target = new URL(process.env.TEST_DATABASE_URL);
assert.ok(['localhost','127.0.0.1'].includes(target.hostname));
assert.match(target.pathname, /^\/test_[a-z0-9_]+$/);
const connection = await mariadb.createConnection({host:target.hostname,port:Number(target.port||3306),user:decodeURIComponent(target.username),password:decodeURIComponent(target.password),database:target.pathname.slice(1),allowPublicKeyRetrieval:true});
const directory = await mkdtemp(join(tmpdir(),'hlf-old-app-'));
let child;
const revision = process.env.COMPATIBILITY_REVISION ?? '0e27bf9';
assert.match(revision,/^[a-f0-9]{7,40}$/);
const env = {...process.env,DATABASE_URL:target.toString(),PORT:'43130',JWT_SIGNING_KEY:'11'.repeat(32),CSRF_HMAC_KEY:'22'.repeat(32),JWT_ISSUER:'compatibility',JWT_AUDIENCE:'compatibility',JWT_KEY_ID:'compatibility',PUBLIC_ORIGIN:'https://test.example'};
const run = (cmd,args,cwd=process.cwd()) => execFileSync(cmd,args,{cwd,env,stdio:'pipe',timeout:120000});
try {
 assert.match((await connection.query('SELECT VERSION() AS v'))[0].v,/^9\.2\.0(?:[-.]|$)/);
 assert.equal((await connection.query('SHOW TABLES')).length,0,'Requires fresh empty disposable DB');
 run(process.execPath,['scripts/prepare-test-db.mjs']);
 const password = 'Synthetic old application passphrase';
 const hash = await hashPassword(password);
 for (const [username,role] of [['compat_buyer','student'],['compat_owner','restaurant_owner'],['compat_admin','admin']]) {
  await connection.query('INSERT INTO accounts(login_identifier,password_hash,role,display_name) VALUES(?,?,?,?)',[username,hash,role,username]);
 }
 const owner = (await connection.query("SELECT id FROM accounts WHERE login_identifier='compat_owner'"))[0].id;
 await connection.query("INSERT INTO restaurants(owner_id,name,address,contact_phone,updated_at) VALUES(?,'Compatibility','Synthetic','0900000000',NOW(3))",[owner]);
 const archive = run('git',['archive',revision,'backend'],resolve('..'));
 execFileSync('tar',['-x','-C',directory],{input:archive});
 const old = join(directory,'backend');
 await symlink(resolve('node_modules'),join(old,'node_modules'));
 run(resolve('node_modules/.bin/prisma'),['generate','--config','prisma7.config.ts'],old);
 run(resolve('node_modules/.bin/tsc'),['-p','tsconfig.build.json'],old);
 // Asserts all original row/column hashes survive expansion, before old app starts.
 run(process.execPath,['scripts/verify-upgrade.mjs']);
 child = spawn(process.execPath,['dist/main.js'],{cwd:old,env,stdio:'ignore'});
 const base = 'http://127.0.0.1:43130/api/v1';
 let ready = false;
 for(let i=0;i<100;i++) {try {await fetch(base+'/auth/me');ready=true;break;} catch {await delay(100);} }
 assert.ok(ready,'Previous application failed to start');
 for(const [username,role] of [['compat_buyer','student'],['compat_owner','restaurant_owner'],['compat_admin','admin']]) {
  const response = await fetch(base+'/auth/login',{method:'POST',headers:{origin:env.PUBLIC_ORIGIN,'content-type':'application/json'},body:JSON.stringify({login_identifier:username,password})});
  assert.equal(response.status,200);
  const account = (await response.json()).data;
  assert.equal(account.role,role);
  const cookies = response.headers.getSetCookie().map(c=>c.split(';')[0]);
  const csrf = decodeURIComponent(cookies.find(c=>c.startsWith('__Host-hlf_csrf=')).split('=').slice(1).join('='));
  const headers = {cookie:cookies.join('; '),origin:env.PUBLIC_ORIGIN,'x-csrf-token':csrf,'content-type':'application/json'};
  const me = await fetch(base+'/auth/me',{headers});assert.equal(me.status,200);assert.equal((await me.json()).data.id,account.id);
  const profile = await fetch(base+'/profile',{method:'PATCH',headers,body:JSON.stringify({expected_version:account.version,display_name:username+' updated'})});assert.equal(profile.status,200);
  const logout = await fetch(base+'/auth/logout',{method:'POST',headers,body:'{}'});assert.equal(logout.status,200);
  assert.equal((await fetch(base+'/auth/me',{headers})).status,401);
 }
 assert.equal((await connection.query('SELECT owner_id FROM restaurants'))[0].owner_id,owner);
 assert.equal((await connection.query('SELECT COUNT(*) AS n FROM admin_authority'))[0].n,0n);
 console.log(`DATA-01 PASS: previous backend ${revision} built with its own Prisma client; buyer/owner/Admin login, me, profile, logout/revocation work after expansion; ownership preserved. PRE-CUTOVER ONLY: old privilege writers must stay stopped after authority cutover.`);
} finally {
 if(child) {child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
 await connection.end();await rm(directory,{recursive:true,force:true});
}
