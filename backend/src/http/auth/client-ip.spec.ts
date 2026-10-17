import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientIp } from './auth.controller.js';

test('login IP trusts forwarding only from configured proxy peers', () => {
  const previous = process.env.TRUSTED_PROXY_IPS;
  try {
    process.env.TRUSTED_PROXY_IPS = '127.0.0.1,::1';
    assert.equal(clientIp({ socket: { remoteAddress: '203.0.113.7' },
      headers: { 'x-forwarded-for': '198.51.100.4' } }), '203.0.113.7');
    assert.equal(clientIp({ socket: { remoteAddress: '::ffff:127.0.0.1' },
      headers: { 'x-forwarded-for': '198.51.100.4' } }), '198.51.100.4');
    assert.equal(clientIp({ socket: { remoteAddress: '127.0.0.1' },
      headers: { 'x-forwarded-for': 'invalid' } }), '127.0.0.1');
  } finally {
    if (previous === undefined) delete process.env.TRUSTED_PROXY_IPS;
    else process.env.TRUSTED_PROXY_IPS = previous;
  }
});
