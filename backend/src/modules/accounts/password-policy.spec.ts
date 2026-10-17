import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { checkCompromisedPassword } from './password-policy.js';

test('compromised password lookup sends only padded hash prefix and rejects a match', async () => {
  const password = 'ThisIsALeakedPassword!42';
  const digest = createHash('sha1').update(password).digest('hex').toUpperCase();
  const request = async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), `https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`);
    assert.equal((init?.headers as Record<string, string>)['Add-Padding'], 'true');
    return new Response(`${digest.slice(5)}:9\r\n`, { status: 200 });
  };
  await assert.rejects(() => checkCompromisedPassword(password, request as typeof fetch),
    (error: { status?: number }) => error.status === 422);
});

test('compromised password lookup permits absent hashes and fails closed on outage', async () => {
  const password = 'AnUncommonPassphrase!42';
  await checkCompromisedPassword(password, async () => new Response(`${'A'.repeat(35)}:0\r\n`) as never);
  await assert.rejects(() => checkCompromisedPassword(password, async () => { throw new Error('offline'); }),
    (error: { status?: number }) => error.status === 503);
});
