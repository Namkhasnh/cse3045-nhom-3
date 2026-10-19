// Real SMTP STARTTLS delivery and MySQL/HTTP verification; no external recipients.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mailbox } from './smtp-sandbox.mjs';

if (!process.env.HLF_SMTP_CHILD) {
  const directory = await mkdtemp('/private/tmp/hlf-smtp-test-');
  try {
    const key = `${directory}/key.pem`, cert = `${directory}/cert.pem`;
    const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key,
      '-out', cert, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'ignore' });
    assert.equal(generated.status, 0);
    const result = spawnSync(process.execPath, [process.argv[1]], { env: { ...process.env,
      HLF_SMTP_CHILD: '1', HLF_SMTP_KEY: key, NODE_EXTRA_CA_CERTS: cert }, stdio: 'inherit', timeout: 60000 });
    if (result.error || result.status !== 0) process.exitCode = 1;
  } finally { await rm(directory, { recursive: true, force: true }); }
} else {
  let app, smtp;
  try {
    const target = new URL(process.env.TEST_DATABASE_URL);
    assert.equal(target.protocol, 'mysql:');
    assert.ok(['localhost','127.0.0.1'].includes(target.hostname));
    assert.match(target.pathname, /^\/test_[a-z0-9_]+$/);
    smtp = await mailbox(process.env.HLF_SMTP_KEY, process.env.NODE_EXTRA_CA_CERTS);
    Object.assign(process.env, { DATABASE_URL: target.toString(), SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.port),
      SMTP_USER: 'sandbox', SMTP_PASSWORD: 'synthetic', SMTP_FROM: 'sandbox@example.invalid',
      JWT_SIGNING_KEY: '11'.repeat(32), CSRF_HMAC_KEY: '22'.repeat(32), JWT_ISSUER: 'smtp-test',
      JWT_AUDIENCE: 'smtp-test', JWT_KEY_ID: 'smtp-test', PUBLIC_ORIGIN: 'https://smtp.example.invalid' });
    // Import after environment is fixed. Email provider and its random codes are unchanged.
    const { Test } = await import('@nestjs/testing');
    const { AppModule } = await import('../../.test-dist/src/app.module.js');
    const { PrismaService } = await import('../../.test-dist/src/prisma/prisma.service.js');
    const { PasswordSafetyService } = await import('../../.test-dist/src/modules/accounts/password-policy.js');
    const { configureApiHttp } = await import('../../.test-dist/src/common/http/api-http.js');
    const { contractFetch } = await import('../../.test-dist/test/auth-contract.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PasswordSafetyService).useValue({ check: async () => {} }).compile();
    app = module.createNestApplication(); configureApiHttp(app); await app.listen(0, '127.0.0.1');
    const prisma = app.get(PrismaService);
    assert.match((await prisma.$queryRawUnsafe('SELECT VERSION() AS v'))[0].v, /^9\.2\.0(?:[-.]|$)/);
    const base = await app.getUrl(), username = `smtp_${randomUUID().slice(0,8)}`;
    const post = (path, body, cookie) => contractFetch(base, path, { method: 'POST',
      headers: { 'content-type': 'application/json', origin: process.env.PUBLIC_ORIGIN, ...cookie }, body: JSON.stringify(body) });
    const input = { login_identifier: username, display_name: 'Synthetic SMTP account',
      password: 'synthetic protected SMTP passphrase', email: `${username}@example.invalid` };
    assert.equal((await post('/auth/register', input)).status, 201);
    const code = () => {
      const message = smtp.messages.at(-1) ?? '';
      const encoding = message.match(/Content-Transfer-Encoding: ([^\r\n]+)/i)?.[1];
      const body = message.slice(message.indexOf('\r\n\r\n') + 4);
      const decoded = encoding === 'base64' ? Buffer.from(body, 'base64').toString()
        : body.replace(/=\r\n/g, '').replace(/=([A-F0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex,16)));
      const match = decoded.match(/: (\d{6})/);
      assert.ok(match, 'Mailbox must receive verification code through SMTP'); return match[1];
    };
    const first = code(); assert.equal(smtp.messages.length, 1);
    const login = () => post('/auth/login', { login_identifier: username, password: input.password });
    assert.equal((await login()).status, 401);
    assert.equal((await post('/auth/resend-email-code', { login_identifier: username })).status, 429);
    await prisma.account.update({ where: { loginIdentifier: username }, data: { emailCodeExpiresAt: new Date(0) } });
    assert.equal((await post('/auth/verify-email', { login_identifier: username, code: first })).status, 422);
    await prisma.account.update({ where: { loginIdentifier: username }, data: { emailCodeSentAt: new Date(Date.now()-61000) } });
    assert.equal((await post('/auth/resend-email-code', { login_identifier: username })).status, 200);
    assert.equal(smtp.messages.length, 2);
    assert.equal((await post('/auth/verify-email', { login_identifier: username, code: code() })).status, 200);
    const session = await login(); assert.equal(session.status, 200);
    const cookies = session.headers.getSetCookie().map(c => c.split(';')[0]);
    const csrf = cookies.find(c => c.startsWith('__Host-hlf_csrf='))?.split('=')[1]; assert.ok(csrf);
    const cookie = cookies.join('; ');
    assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { cookie } })).status, 200);
    assert.equal((await post('/auth/logout', {}, { cookie, 'x-csrf-token': csrf })).status, 200);
    assert.equal((await fetch(`${base}/api/v1/auth/me`, { headers: { cookie } })).status, 401);
    console.log('PASS AUTH-01/03 SMTP: real STARTTLS + AUTH delivery, random code, preverify denial, expiry, resend limit/success, verification, login, logout revocation.');
  } catch (error) {
    const location = error.stack?.split('\n').find(line => line.includes('test/cli/smtp.mjs:'))?.trim().replace(/^.*smtp.mjs:/, 'line ');
    console.error(`SMTP acceptance FAILED (${error.name}; ${location ?? 'transport'}; details redacted).`); process.exitCode = 1;
  } finally { await app?.close(); await smtp?.close(); }
}
