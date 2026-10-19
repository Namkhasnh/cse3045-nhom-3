import 'dotenv/config';
import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { createPublicKey, verify, randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { provisionDatabaseUrl } from '../prisma/database.config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AdminProvisionRepository } from '../modules/accounts/admin-provision.repository.js';
import { base32, matchingStep } from '../modules/accounts/mfa-crypto.js';
import { hashPassword } from '../modules/accounts/password-hash.js';
import { spawnSync } from 'node:child_process';
import { canonicalUsername, PasswordSafetyService } from '../modules/accounts/password-policy.js';

type Manifest = { request_id: string; environment: string; database: string;
  role: 'admin'; username: string; display_name: string;
  requester: string; reviewer: string; reason: string; approved_at: string;
  operation: 'initialize' | 'recover'; legacy_admin_ids: string[]; legacy_owner_ids: string[] };

function parseArguments(): { role: Manifest['role']; username: string } {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--role' || args[2] !== '--username' ||
      args[1] !== 'admin') throw new Error('Use --role admin --username <username>.');
  return { role: args[1] as Manifest['role'], username: canonicalUsername(args[3]) };
}

export function validateManifest(value: unknown): Manifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid approval manifest.');
  const manifest = value as Record<string, unknown>;
  const keys = ['request_id', 'environment', 'database', 'role', 'username', 'display_name',
    'requester', 'reviewer', 'reason', 'approved_at'];
  const optional = ['operation', 'legacy_admin_ids', 'legacy_owner_ids'];
  if (Object.keys(manifest).some((key) => !keys.includes(key) && !optional.includes(key)) || keys.some((key) => typeof manifest[key] !== 'string')) {
    throw new Error('Invalid approval manifest fields.');
  }
  const result = manifest as Manifest;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(result.request_id) ||
      result.role !== 'admin' ||
      canonicalUsername(result.username) !== result.username ||
      !result.display_name.trim() || [...result.display_name].length > 200 ||
      !result.requester.trim() || !result.reviewer.trim() || result.requester === result.reviewer ||
      !result.reason.trim() || result.reason.length > 1000 ||
      !Number.isFinite(Date.parse(result.approved_at))) throw new Error('Invalid approval manifest content.');
  if (!['initialize', 'recover'].includes(result.operation) || !Array.isArray(result.legacy_admin_ids) ||
      !Array.isArray(result.legacy_owner_ids) || [...result.legacy_admin_ids, ...result.legacy_owner_ids].some(v => typeof v !== 'string' || !/^[1-9][0-9]*$/.test(v))) throw new Error('Explicit operation and legacy mapping required');
  return result;
}

export async function readApprovedManifest(): Promise<Manifest> {
  const path = process.env.ACCOUNT_PROVISION_MANIFEST;
  const publicKeyPath = process.env.ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY;
  if (!path || !publicKeyPath) throw new Error('Approved manifest and reviewer public key paths are required.');
  const [body, signatureText, publicKeyText] = await Promise.all([
    readFile(path), readFile(`${path}.sig`, 'utf8'), readFile(publicKeyPath, 'utf8'),
  ]);
  const signature = Buffer.from(signatureText.trim(), 'base64');
  const reviewerKey = createPublicKey(publicKeyText);
  if (reviewerKey.asymmetricKeyType !== 'ed25519' || signature.length !== 64 ||
      !verify(null, body, reviewerKey, signature)) {
    throw new Error('Reviewer signature is invalid.');
  }
  return validateManifest(JSON.parse(body.toString('utf8')));
}

function readPassword(prompt = 'Password'): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('Protected interactive terminal required.');
  return new Promise((resolve, reject) => {
    let password = '';
    process.stdout.write(`${prompt}: `);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error?: Error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(password);
    };
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') return finish(new Error('Cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f') { password = [...password].slice(0, -1).join(''); continue; }
        password += character;
        if (Buffer.byteLength(password, 'utf8') > 1024) return finish(new Error('Password too long.'));
      }
    };
    process.stdin.on('data', onData);
  });
}

async function verifyRestoreEvidence(databaseUrl: string) {
  const path = process.env.CUTOVER_RESTORE_EVIDENCE;
  if (!path) throw new Error('CUTOVER_RESTORE_EVIDENCE is required');
  const evidence = JSON.parse(await readFile(path, 'utf8')) as { restored: boolean; backup: string; backup_sha256: string; inventory: unknown; completed_at: string };
  if (!evidence.restored || Date.now() - Date.parse(evidence.completed_at) > 86400000 || !Number.isFinite(Date.parse(evidence.completed_at))) throw new Error('Recent restore evidence required');
  if (createHash('sha256').update(await readFile(evidence.backup)).digest('hex') !== evidence.backup_sha256) throw new Error('Backup checksum mismatch');
  const inventory = spawnSync(process.execPath, ['scripts/retained-inventory.mjs'], { encoding: 'utf8', env: { ...process.env, DATABASE_URL: databaseUrl, INVENTORY_OUTPUT: '' } });
  if (inventory.status !== 0 || JSON.stringify(JSON.parse(inventory.stdout)) !== JSON.stringify(evidence.inventory)) throw new Error('Source changed since restore rehearsal');
}

async function main() {
  const databaseUrl = provisionDatabaseUrl();
  const { role, username } = parseArguments();
  const manifest = await readApprovedManifest();
  if (manifest.role !== role || manifest.username !== username || !process.env.NODE_ENV || manifest.environment !== process.env.NODE_ENV) throw new Error('Manifest identity mismatch');
  await verifyRestoreEvidence(databaseUrl);
  const prisma = new PrismaService(databaseUrl);
  try {
    await prisma.onModuleInit();
    const rows = await prisma.$queryRaw<Array<{ db: string; version: string }>>`SELECT DATABASE() AS db, VERSION() AS version`;
    if (rows[0]?.db !== manifest.database || !/^9\.2\.0(?:[-.]|$)/.test(rows[0]?.version ?? '')) throw new Error('Database identity/version mismatch');
    const recover = manifest.operation === 'recover';
    let passwordHash: string | undefined;
    if (!recover) {
      const password = await readPassword();
      if (password !== await readPassword('Confirm password')) throw new Error('Passwords differ');
      await new PasswordSafetyService().check(password); passwordHash = await hashPassword(password);
    }
    if (!process.stdout.isTTY) throw new Error('Private interactive terminal required');
    const secret = base32(randomBytes(20));
    const uri = `otpauth://totp/${encodeURIComponent(`Hoa Lac Food:${username}`)}?secret=${secret}&issuer=Hoa%20Lac%20Food&algorithm=SHA1&digits=6&period=30`;
    process.stdout.write(`Import into your Authenticator (private terminal only):\n${uri}\n`);
    const step = matchingStep(secret, await readPassword('Authenticator code'), -1n);
    if (step === null) throw new Error('Enrollment proof invalid');
    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(16).toString('hex'));
    process.stdout.write(`Save these single-use recovery codes in your password manager:\n${recoveryCodes.join('\n')}\n`);
    if (await readPassword('Type SAVED after securing the codes') !== 'SAVED') throw new Error('Custody not acknowledged');
    const id = await new AdminProvisionRepository(prisma, new AuditService()).apply({ username, displayName: manifest.display_name,
      passwordHash, requestId: manifest.request_id, secret, step, recoveryCodes, recover,
      legacyAdminIds: manifest.legacy_admin_ids.map(BigInt), legacyOwnerIds: manifest.legacy_owner_ids.map(BigInt) });
    process.stdout.write(`Sole Admin ${id} enrolled; previous sessions revoked.\n`);
  } finally { await prisma.onModuleDestroy(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write('Provisioning failed. Check the approved manifest, environment, database, role and account status.\n');
    process.exitCode = 1;
  });
}
