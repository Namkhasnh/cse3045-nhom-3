import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authContract, schema } from './auth-contract.js';

test('V0.1 machine contract has complete examples and closes privilege/MFA fields', () => {
 assert.equal(authContract.openapi, '3.1.0');
 for (const path of ['/auth/register','/auth/login','/auth/me','/profile','/restaurants','/dishes','/orders']) assert.ok(path in authContract.paths, `Missing route ${path}`);
 const references = (value: unknown): void => {
  if (!value || typeof value !== 'object') return;
  if ('$ref' in value) {
   const path = String(value.$ref); assert.ok(path.startsWith('#/'));
   let resolved: unknown = authContract;
   for (const key of path.slice(2).split('/')) resolved = (resolved as Record<string, unknown>)?.[key];
   assert.ok(resolved, `Unresolved contract reference: ${path}`);
  }
  for (const child of Object.values(value)) references(child);
 };
 references(authContract);
 for (const [name, definition] of Object.entries(authContract.components.schemas)) {
  const validate = schema(name);
  for (const example of definition.examples ?? []) assert.ok(validate(example), `${name}: ${JSON.stringify(validate.errors)}`);
 }
 const registration = authContract.components.schemas.Register.examples![0] as Record<string, unknown>;
 for (const field of ['role','requested_role','capabilities','managed_restaurant_id','user_id']) {
  assert.equal(schema('Register')({ ...registration, [field]: 'admin' }), false);
 }
 const challenge_id = 'a'.repeat(43);
 assert.equal(schema('MfaProof')({challenge_id}), false);
 assert.equal(schema('MfaProof')({challenge_id,code:'123456',recovery_code:'ab'.repeat(16)}), false);
 assert.equal(schema('ProfilePatch')({expected_version:1}), false);
 assert.equal(schema('ProfilePatch')({expected_version:1,display_name:'Valid',user_id:'2'}), false);
});
