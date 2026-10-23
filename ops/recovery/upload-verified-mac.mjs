// Uploads only one already-restored, age-encrypted Mac backup after explicit approval.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { gunzipSync } from 'node:zlib';

assert.equal(process.argv.length, 4, 'Usage: --upload-approved PRIVATE_BACKUP_DIRECTORY');
assert.equal(process.argv[2], '--upload-approved', 'Explicit upload approval flag required');
const parent = `${homedir()}/Library/Application Support/HLF Backup`;
const directory = await realpath(process.argv[3]);
assert.match(directory.slice(parent.length), /^\/full-[a-zA-Z0-9]+$/);
assert.ok(directory.startsWith(`${parent}/`), 'Only protected Mac backup directory allowed');
const receiptPath = `${directory}/evidence.json`;
const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
assert.equal(receipt.result, 'PASS');
assert.equal(receipt.source, 'Mac 127.0.0.1:3307/hlf_dev_flow');
assert.equal(receipt.exact_schema_and_all_row_hashes, 'PASS');
assert.equal(receipt.private_key_uploaded, false);
assert.match(receipt.proposed_remote, /^hlfdrive:HLF-Backup-Mac\/full-[0-9a-f-]{36}\/database\.json\.gz\.age$/);
const identity = process.env.HLF_BACKUP_IDENTITY;
assert.ok(identity, 'Existing age identity required for read-back verification');
const env = { PATH: process.env.PATH, HOME: homedir(), TMPDIR: process.env.TMPDIR };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function command(bin, args) {
  const result = spawnSync(bin, args, { env, encoding: null, timeout: 300000, maxBuffer: 128 * 1024 * 1024 });
  assert.equal(result.status, 0, `Safe child failure: ${bin}`);
  return result.stdout;
}
const archive = `${directory}/database.json.gz.age`;
const bytes = await readFile(archive);
assert.equal(hash(bytes), receipt.ciphertext_sha256);
assert.equal(bytes.length, receipt.ciphertext_bytes);
const remote = receipt.proposed_remote;
const local = `${directory}/drive-readback.json.gz.age`;
const started = new Date().toISOString();
try {
  command('rclone', ['copyto', archive, remote, '--retries', '1', '--low-level-retries', '1']);
  command('rclone', ['copyto', remote, local, '--retries', '1', '--low-level-retries', '1']);
  assert.equal(hash(await readFile(local)), receipt.ciphertext_sha256, 'Drive read-back differs from restored archive');
  // Decrypt in memory only; no plaintext SQL or key output, restored app remains disabled.
  const recovered = JSON.parse(gunzipSync(command('age', ['-d', '-i', identity, local])));
  assert.equal(recovered.format, 'hlf-retained-mac-full-v1');
  assert.equal(recovered.source, receipt.source);
  assert.equal(Object.keys(recovered.manifest).length, receipt.tables);
  assert.equal(Object.values(recovered.manifest).reduce((sum, table) => sum + table.count, 0), receipt.rows);
  receipt.offsite = { result: 'PASS', remote, started_at: started, verified_at: new Date().toISOString(),
    ciphertext_sha256: receipt.ciphertext_sha256, decrypt_and_manifest: 'PASS',
    restore_basis: 'Ciphertext exactly matches the archive already restored and fully compared on disposable MySQL9.2.0',
    limits: 'Single SQL snapshot, no automatic scheduler/binlog shipping/media/offline custody or operational RPO/RTO acceptance' };
  receipt.remote = remote;
} catch {
  receipt.offsite = { result: 'FAIL', started_at: started, failed_at: new Date().toISOString(), reason: 'TRANSFER_OR_READBACK_VALIDATION_FAILED' };
  process.exitCode = 1;
} finally {
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ offsite: receipt.offsite.result, private_key_uploaded: false }));
}
