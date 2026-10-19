// Explicit operator action; no business rows or existing users/grants are changed.
import 'dotenv/config';
import mariadb from 'mariadb';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
if (process.argv.length !== 3 || process.argv[2] !== '--apply-local') throw new Error('Explicit --apply-local required');
const source = new URL(process.env.DB_OPERATOR_URL ?? process.env.DATABASE_URL);
if (!['localhost','127.0.0.1'].includes(source.hostname) || !/^[a-zA-Z0-9_]+$/.test(source.pathname.slice(1))) throw new Error('Local MySQL database required');
const output = process.env.DB_IDENTITY_OUTPUT;
if (!output?.startsWith('/private/tmp/')) throw new Error('New private DB_IDENTITY_OUTPUT under /private/tmp required');
const original = await readFile('.env','utf8');
await mkdir(output,{mode:0o700});
const c = await mariadb.createConnection({host:source.hostname,port:Number(source.port||3306),user:decodeURIComponent(source.username),password:decodeURIComponent(source.password),database:source.pathname.slice(1),allowPublicKeyRetrieval:true});
let runtime;
try {
 if (!/^9\.2\.0(?:[-.]|$)/.test((await c.query('SELECT VERSION() AS v'))[0].v)) throw new Error('MySQL 9.2.0 required');
 const suffix = randomBytes(6).toString('hex');
 const users = {};
 for (const kind of ['runtime','provision']) {
  const name = `hlf_${kind}_${suffix}`, password = randomBytes(32).toString('hex');
  await c.query(`CREATE USER '${name}'@'%' IDENTIFIED BY '${password}'`);
  const url = new URL(source);url.username=name;url.password=password;
  users[kind] = {account:`'${name}'@'%'`,url:url.toString()};
 }
 const sql = (await readFile(new URL('../prisma/permissions/grants.sql',import.meta.url),'utf8'))
  .replaceAll('{{database}}',`\`${source.pathname.slice(1)}\``).replaceAll('{{runtime}}',users.runtime.account).replaceAll('{{provision}}',users.provision.account);
 for (const statement of sql.split(';')) { const stripped=statement.replace(/--[^\n]*/g,'').trim();if(stripped)await c.query(stripped); }
 const u = new URL(users.runtime.url);
 runtime = await mariadb.createConnection({host:u.hostname,port:Number(u.port||3306),user:u.username,password:u.password,database:u.pathname.slice(1),allowPublicKeyRetrieval:true});
 await runtime.query('SELECT * FROM admin_authority');
 for (const statement of ['UPDATE admin_authority SET account_id=account_id WHERE 0','DELETE FROM admin_authority WHERE 0',"UPDATE admin_factors SET encrypted_secret='' WHERE 0"]) {
  let denied=false;
  try {await runtime.query(statement);} catch(error) {if([1142,1143].includes(error.errno))denied=true;else throw error;}
  if(!denied)throw new Error('Runtime restriction missing');
 }
 await writeFile(`${output}/operator.env`,`MIGRATION_DATABASE_URL=${source.toString()}\nDB_OPERATOR_URL=${source.toString()}\nPROVISION_DATABASE_URL=${users.provision.url}\n`,{flag:'wx',mode:0o600});
 const updated = original.split('\n').filter(line=>!/^\s*(?:DATABASE_URL|PROVISION_DATABASE_URL|MIGRATION_DATABASE_URL|DB_OPERATOR_URL)\s*=/.test(line)).join('\n');
 if(await readFile('.env','utf8')!==original)throw new Error('Runtime env changed concurrently');
 await writeFile('.env',`DATABASE_URL="${users.runtime.url}"\n${updated}`,{mode:0o600});await chmod('.env',0o600);
 console.log(`Restricted local runtime configured; protected operator file: ${output}/operator.env. Restart backend to load it.`);
} catch {process.stderr.write('Local identity configuration failed; details redacted. Inspect operator state before retry.\n');process.exitCode=1;}
finally {await runtime?.end();await c.end();}
