import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readApprovedManifest, validateManifest } from './account-provision.js';

const valid = { request_id: 'request_1234', environment: 'staging', database: 'test_auth',
  role: 'admin', username: 'first.admin', display_name: 'First Admin', requester: 'Operator One',
  reviewer: 'Operator Two', reason: 'Initial bootstrap', approved_at: '2026-10-17T00:00:00Z' };

test('provision manifest rejects public student or same requester/reviewer', () => {
  assert.throws(() => validateManifest({ ...valid, role: 'student' }));
  assert.throws(() => validateManifest({ ...valid, reviewer: valid.requester }));
  assert.throws(() => validateManifest({ ...valid, unexpected: true }));
});

test('provision manifest requires a valid reviewer Ed25519 signature over exact bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hlf-provision-'));
  const manifestPath = join(directory, 'request.json');
  const publicKeyPath = join(directory, 'reviewer.pub.pem');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const body = Buffer.from(JSON.stringify(valid));
  const previousManifest = process.env.ACCOUNT_PROVISION_MANIFEST;
  const previousKey = process.env.ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY;
  try {
    await writeFile(manifestPath, body);
    await writeFile(`${manifestPath}.sig`, sign(null, body, privateKey).toString('base64'));
    await writeFile(publicKeyPath, publicKey.export({ type: 'spki', format: 'pem' }));
    process.env.ACCOUNT_PROVISION_MANIFEST = manifestPath;
    process.env.ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY = publicKeyPath;
    assert.equal((await readApprovedManifest()).username, 'first.admin');
    await writeFile(manifestPath, Buffer.concat([await readFile(manifestPath), Buffer.from(' ')]));
    await assert.rejects(() => readApprovedManifest(), /signature/i);
  } finally {
    if (previousManifest === undefined) delete process.env.ACCOUNT_PROVISION_MANIFEST;
    else process.env.ACCOUNT_PROVISION_MANIFEST = previousManifest;
    if (previousKey === undefined) delete process.env.ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY;
    else process.env.ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});
