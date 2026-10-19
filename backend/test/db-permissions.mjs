import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

// Called only by guarded disposable-DB harnesses with their operator connection.
export async function restrictedIdentities(connection, target) {
  const database = target.pathname.slice(1);
  if (!/^test_[a-z0-9_]+$/.test(database)) throw new Error('Disposable database required');
  const suffix = randomBytes(6).toString('hex');
  const identities = {};
  for (const kind of ['runtime', 'provision']) {
    const user = `hlf_${kind}_${suffix}`;
    const password = randomBytes(24).toString('hex');
    await connection.query(`CREATE USER '${user}'@'%' IDENTIFIED BY '${password}'`);
    const url = new URL(target); url.username = user; url.password = password;
    identities[kind] = url.toString();
    identities[`${kind}Account`] = `'${user}'@'%'`;
  }
  const sql = (await readFile(new URL('../prisma/permissions/grants.sql', import.meta.url), 'utf8'))
    .replaceAll('{{database}}', `\`${database}\``)
    .replaceAll('{{runtime}}', identities.runtimeAccount).replaceAll('{{provision}}', identities.provisionAccount);
  for (const statement of sql.split(';')) {
    const stripped = statement.replace(/--[^\n]*/g, '').trim();
    if (stripped) await connection.query(stripped);
  }
  return identities;
}
