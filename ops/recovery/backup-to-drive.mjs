// Manual Mac development backup; no scheduler or automatic deletion.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const settingsDirectory = `${homedir()}/Library/Application Support/HLF Backup`;
const settingsPath = `${settingsDirectory}/settings.json`;
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--identity'), 'Use no arguments, or --identity EXISTING_KEY_PATH on first setup');
let identity;
try {
  identity = args.length ? args[1] : JSON.parse(await readFile(settingsPath, 'utf8')).identity_path;
  assert.ok(typeof identity === 'string' && identity.startsWith('/'), 'Existing absolute age identity path required');
} catch {
  console.error('Chưa có cấu hình khóa. Chạy lại với --identity và đường dẫn file khóa age có sẵn; không nhập nội dung khóa.');
  process.exit(1);
}
function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root, env: { ...process.env, HLF_BACKUP_IDENTITY: identity },
    encoding: 'utf8', timeout: 600000, maxBuffer: 1024 * 1024,
  });
  // Child stderr can include private paths; report only the safe last JSON status.
  let status;
  try { status = JSON.parse(result.stdout.trim().split('\n').at(-1)); } catch { /* fail below */ }
  if (result.status !== 0 || !status) throw new Error('BACKUP_STEP_FAILED');
  return status;
}
try {
  console.log('Đang mã hóa DB Mac và kiểm chứng restore MySQL 9.2.0…');
  const local = run('ops/recovery/backup-mac.mjs', ['--protect-hlf-dev-flow', '--local-only']);
  assert.equal(local.result, 'PASS');
  const directory = dirname(local.private_evidence);
  console.log('Restore PASS. Đang tải bản mã hóa lên Google Drive và đọc lại kiểm tra…');
  const uploaded = run('ops/recovery/upload-verified-mac.mjs', ['--upload-approved', directory]);
  assert.equal(uploaded.offsite, 'PASS');
  await mkdir(settingsDirectory, { recursive: true, mode: 0o700 });
  await writeFile(settingsPath, JSON.stringify({ identity_path: identity }, null, 2) + '\n', { mode: 0o600 });
  console.log('PASS: backup mã hóa đã được kiểm chứng và lưu trên Google Drive (HLF-Backup-Mac). Bạn có thể tắt Mac.');
  console.log(JSON.stringify({ result: 'PASS', private_evidence: local.private_evidence }));
} catch {
  console.error('Backup chưa hoàn tất. Không xóa dữ liệu/khóa; bản backup trước vẫn được giữ. Kiểm tra Docker, Drive và khóa age rồi chạy lại.');
  process.exitCode = 1;
}
