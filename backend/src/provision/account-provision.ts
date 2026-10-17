import 'dotenv/config';
import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { createPublicKey, verify } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { canonicalUsername, PasswordSafetyService } from '../modules/accounts/password-policy.js';
import { EmailVerificationService } from '../modules/accounts/email-verification.service.js';

type Manifest = { request_id: string; environment: string; database: string;
  role: 'admin' | 'restaurant_owner'; username: string; display_name: string;
  requester: string; reviewer: string; reason: string; approved_at: string };

function parseArguments(): { role: Manifest['role']; username: string } {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--role' || args[2] !== '--username' ||
      !['admin', 'restaurant_owner'].includes(args[1])) throw new Error('Use --role <admin|restaurant_owner> --username <username>.');
  return { role: args[1] as Manifest['role'], username: canonicalUsername(args[3]) };
}

export function validateManifest(value: unknown): Manifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid approval manifest.');
  const manifest = value as Record<string, unknown>;
  const keys = ['request_id', 'environment', 'database', 'role', 'username', 'display_name',
    'requester', 'reviewer', 'reason', 'approved_at'];
  if (Object.keys(manifest).some((key) => !keys.includes(key)) || keys.some((key) => typeof manifest[key] !== 'string')) {
    throw new Error('Invalid approval manifest fields.');
  }
  const result = manifest as Manifest;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(result.request_id) ||
      !['admin', 'restaurant_owner'].includes(result.role) ||
      canonicalUsername(result.username) !== result.username ||
      !result.display_name.trim() || [...result.display_name].length > 200 ||
      !result.requester.trim() || !result.reviewer.trim() || result.requester === result.reviewer ||
      !result.reason.trim() || result.reason.length > 1000 ||
      !Number.isFinite(Date.parse(result.approved_at))) throw new Error('Invalid approval manifest content.');
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

function readPassword(): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('Protected interactive terminal required.');
  return new Promise((resolve, reject) => {
    let password = '';
    process.stdout.write('Password: ');
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

async function main() {
  const { role, username } = parseArguments();
  const manifest = await readApprovedManifest();
  if (manifest.role !== role || manifest.username !== username ||
      !process.env.NODE_ENV || manifest.environment !== process.env.NODE_ENV) {
    throw new Error('Manifest does not match role, username or environment.');
  }
  const prisma = new PrismaService();
  try {
    await prisma.onModuleInit();
    const rows = await prisma.$queryRaw<Array<{ db: string; version: string }>>`SELECT DATABASE() AS db, VERSION() AS version`;
    if (rows[0]?.db !== manifest.database || !/^8\.4\.11(?:[-.]|$)/.test(rows[0]?.version ?? '')) {
      throw new Error('Database identity or approved MySQL version mismatch.');
    }
    const accounts = new AccountsService(prisma, new AuditService(), new PasswordSafetyService(),
      new EmailVerificationService());
    const existing = await prisma.account.findUnique({ where: { loginIdentifier: username } });
    if (existing) {
      const result = await accounts.provision(username, '', role, manifest.display_name, manifest.request_id);
      if (!result.created) { process.stdout.write('Already provisioned by this approved request.\n'); return; }
    }
    const password = await readPassword();
    const result = await accounts.provision(username, password, role, manifest.display_name, manifest.request_id);
    process.stdout.write(result.created ? 'Account provisioned.\n' : 'Already provisioned by this approved request.\n');
  } finally {
    await prisma.onModuleDestroy();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write('Provisioning failed. Check the approved manifest, environment, database, role and account status.\n');
    process.exitCode = 1;
  });
}
