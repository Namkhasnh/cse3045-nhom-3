import assert from 'node:assert/strict';
import { test } from 'node:test';
import { databaseConfig } from './database.config.js';

test('database URL decodes credentials and defaults to the MySQL port', () => {
  const config = databaseConfig('mysql://app%40user:p%40ss%3Aword@localhost/cse3045');
  assert.equal(config.user, 'app@user');
  assert.equal(config.password, 'p@ss:word');
  assert.equal(config.port, 3306);
  assert.equal(config.database, 'cse3045');
  assert.equal(config.allowPublicKeyRetrieval, true);
  assert.equal(databaseConfig('mysql://app:pass@localhost:3307/db').port, 3307);
});

test('RSA public key retrieval is restricted to loopback connections', () => {
  assert.equal(databaseConfig('mysql://app:pass@[::1]/db').allowPublicKeyRetrieval, true);
  assert.equal(databaseConfig('mysql://app:pass@db.example.com/db').allowPublicKeyRetrieval, false);
});

test('invalid connection URLs fail without exposing credentials', () => {
  for (const value of [
    '', 'invalid', 'postgres://app:secret@localhost/db',
    'mysql://app:secret@localhost/', 'mysql://localhost/db',
    'mysql://app:secret@localhost:99999/db',
    'mysql://app:secret@localhost/db?ssl=true',
    'mysql://app:%ZZ@localhost/db',
  ]) {
    assert.throws(() => databaseConfig(value), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('DATABASE_URL'));
      assert.ok(!error.message.includes('secret'));
      return true;
    });
  }
});
