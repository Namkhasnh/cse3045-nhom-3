// Only called with the newly created disposable rehearsal container and connection.
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { file, seal, open } from './archive.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function rehearseBinlog(connection, docker, command, directory, useDrive) {
  const started = Date.now();
  const source = 'test_binlog_source', target = 'test_binlog_restore';
  for (const db of [source, target]) await connection.query(`CREATE DATABASE \`${db}\``);
  await connection.query(`USE ${source}`);
  await connection.query('CREATE TABLE recovery_probe (id BIGINT UNSIGNED PRIMARY KEY, amount DECIMAL(30,0) NOT NULL, note VARCHAR(100) NOT NULL) ENGINE=InnoDB');
  await connection.query("INSERT INTO recovery_probe VALUES (9007199254740993,9007199254740995,'full'),(2,2,'delete-me')");
  const dump = docker(['mysqldump', '-uroot', '--single-transaction', '--source-data=2', '--no-tablespaces', '--set-gtid-purged=OFF', '--column-statistics=0', source]);
  const match = dump.match(/SOURCE_LOG_FILE='([^']+)', SOURCE_LOG_POS=(\d+)/);
  assert.ok(match, 'Full backup coordinates absent');
  const start = { file: match[1], position: Number(match[2]) };
  assert.match(start.file, /^[a-zA-Z0-9_.-]+\.\d+$/);
  await connection.beginTransaction();
  await connection.query("UPDATE recovery_probe SET amount=amount+7,note='increment-one' WHERE id=9007199254740993");
  await connection.query('DELETE FROM recovery_probe WHERE id=2');
  await connection.commit();
  await connection.query('FLUSH BINARY LOGS'); // Disposable instance only.
  await connection.beginTransaction();
  await connection.query("INSERT INTO recovery_probe VALUES (3,123456789012345678901234567890,'increment-two')");
  await connection.commit();
  await connection.beginTransaction();
  await connection.query("INSERT INTO recovery_probe VALUES (4,4,'rolled-back')");
  await connection.rollback();
  const endRow = (await connection.query('SHOW BINARY LOG STATUS'))[0];
  const end = { file: endRow.File, position: Number(endRow.Position) };
  assert.notEqual(start.file, end.file);
  const readRows = async db => {
    const rows = await connection.query(`SELECT CAST(id AS CHAR) id, CAST(amount AS CHAR) amount, note FROM ${db}.recovery_probe ORDER BY id`);
    return Array.from(rows, row => ({ ...row }));
  };
  const expected = await readRows(source);
  assert.equal(expected[1].amount, '9007199254741002');
  assert.equal(expected[0].amount, '123456789012345678901234567890');
  await connection.query("INSERT INTO recovery_probe VALUES (5,5,'after-cutoff')");
  await connection.query('FLUSH BINARY LOGS');
  const listed = await connection.query('SHOW BINARY LOGS');
  const selected = listed.filter(row => row.Log_name >= start.file && row.Log_name <= end.file);
  assert.equal(selected.length, 2);
  const chunks = selected.map(row => {
    const bytes = docker(['cat', `/var/lib/mysql/${row.Log_name}`], { encoding: null });
    return { name: row.Log_name, bytes, sha256: hash(bytes) };
  });
  // Keep binary files authenticated with full SQL, not plaintext transfer.
  const payload = { format: 'hlf-synthetic-recovery-v1', synthetic: true, recoveryPoint: new Date().toISOString(),
    files: [file('database/synthetic.sql', Buffer.from(dump)), ...chunks.map(x => file(`database/${x.name}`, x.bytes))], aiCounters: { synthetic_global: '100' } };
  const keys = generateKeyPairSync('rsa', { modulusLength: 3072 });
  const encrypted = seal(payload, keys.publicKey);
  let downloaded = encrypted;
  let offsite = { result: 'NOT RUN' };
  if (useDrive) {
    const remote = `hlfdrive:HLF-Backup-Synthetic/binlog-drill-${randomUUID()}/full-binlog.encrypted.json`;
    const local = `${directory}/full-binlog.encrypted.json`, readback = `${directory}/full-binlog.downloaded.json`;
    await writeFile(local, encrypted, { mode: 0o600 });
    await writeFile(readback, '', { mode: 0o600 });
    const transferStarted = Date.now();
    command('rclone', ['copyto', local, remote, '--retries', '1', '--low-level-retries', '1']);
    command('rclone', ['copyto', remote, readback, '--retries', '1', '--low-level-retries', '1']);
    downloaded = await readFile(readback, 'utf8');
    assert.equal(hash(downloaded), hash(encrypted), 'Offsite full/binlog bundle differs');
    offsite = { result: 'PASS', remote, ciphertext_sha256: hash(downloaded), transfer_readback_ms: Date.now() - transferStarted };
  }
  const recovered = open(downloaded, keys.privateKey);
  function validateChain(files) {
    assert.equal(files.length, chunks.length, 'Missing binlog increment');
    files.forEach((entry, index) => {
      assert.equal(entry.name, chunks[index].name, 'Reordered binlog chain');
      assert.equal(hash(entry.bytes), chunks[index].sha256, 'Corrupt binlog increment');
    });
  }
  const restoredChunks = chunks.map(x => ({ name: x.name, bytes: Buffer.from(recovered.files.find(f => f.path === `database/${x.name}`).content, 'base64') }));
  assert.throws(() => validateChain(restoredChunks.slice(1)), /Missing/);
  assert.throws(() => validateChain([...restoredChunks].reverse()), /Reordered/);
  const corrupt = restoredChunks.map(x => ({ ...x, bytes: Buffer.from(x.bytes) }));
  corrupt[0].bytes[20] ^= 1;
  assert.throws(() => validateChain(corrupt), /Corrupt/);
  validateChain(restoredChunks);
  docker(['mysql', '-uroot', target], { input: Buffer.from(recovered.files[0].content, 'base64') });
  assert.notDeepEqual(await readRows(target), expected, 'Full-only restore must lack increments');
  // Native mysqlbinlog reads only recovered, checksum-verified synthetic files.
  for (const chunk of restoredChunks) await writeFile(`${directory}/hlf-${chunk.name}`, chunk.bytes, { mode: 0o600 });
  const sql = command('mysqlbinlog', [ '--verify-binlog-checksum', `--rewrite-db=${source}->${target}`, `--database=${target}`,
    `--start-position=${start.position}`, `--stop-position=${end.position}`, ...restoredChunks.map(x => `${directory}/hlf-${x.name}`)]);
  docker(['mysql', '-uroot', target], { input: sql });
  assert.deepEqual(await readRows(target), expected, 'Point-in-time restore differs');
  assert.equal((await readRows(target)).length, 2);
  assert.equal((await readRows(source)).length, 3, 'Source must retain after-cutoff transaction');
  return { result: 'PASS', offsite, mysqlbinlog_version: command('mysqlbinlog', ['--version']).trim(), start, end,
    increments: chunks.map(x => ({ name: x.name, bytes: x.bytes.length, sha256: x.sha256 })),
    ciphertext_sha256: hash(encrypted), ciphertext_bytes: Buffer.byteLength(encrypted), elapsed_ms: Date.now() - started,
    rows: 2, exact_large_integer_and_decimal: 'PASS', full_only_missing_increments: 'PASS', committed_update_insert_delete: 'PASS',
    rolled_back_and_after_cutoff_excluded: 'PASS', missing_reordered_corrupt_chain_refused: 'PASS',
    limits: 'Local synthetic probe table and authenticated in-memory bundle; no unattended binlog shipping, concurrent DDL/writes during full backup, application intent replay, offline age custody or operational RPO/RTO proof' };
}
