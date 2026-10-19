import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';

type Schema = Record<string, unknown>;
type HttpResponse = { content: { 'application/json': { schema: Schema } } };
type Operation = { requestBody?: { content: { 'application/json': { schema: Schema } } };
 responses: Record<string, HttpResponse | { $ref: string }> };
export const authContract = JSON.parse(readFileSync('../docs/data/openapi.yaml', 'utf8')) as {
 openapi: string; paths: Record<string, Record<string, Operation>>;
 components: { responses: Record<string, HttpResponse>; schemas: Record<string, Schema & { examples?: unknown[] }> };
};
// OpenAPI 3.1 schemas here use the shared JSON Schema subset supported by Ajv.
export const validator = new Ajv({ strict: false, allErrors: true });
validator.addFormat('date-time', value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)));
validator.addSchema(authContract, 'auth-contract');
export function schema(name: string) {
 const validate = validator.getSchema(`auth-contract#/components/schemas/${name}`);
 assert.ok(validate, `Missing contract schema: ${name}`);
 return validate;
}

// Validate the actual HTTP exchange, leaving negative inputs to the API validator.
export async function contractFetch(base: string, path: string, init?: RequestInit) {
 const operation = authContract.paths[path]?.[(init?.method ?? 'GET').toLowerCase()];
 assert.ok(operation, `Undocumented V0.1 operation: ${path}`);
 const response = await fetch(`${base}/api/v1${path}`, init);
 const documented = operation.responses[String(response.status)];
 assert.ok(documented, `Undocumented V0.1 status: ${response.status}`);
 const resolved = '$ref' in documented ? authContract.components.responses[documented.$ref.split('/').at(-1)!] : documented;
 assert.ok(resolved, 'Missing response reference');
 const responseSchema = resolved.content['application/json'].schema;
 const validate = validator.compile({ $ref: `auth-contract${responseSchema.$ref}` });
 assert.ok(validate(await response.clone().json()), `Contract response mismatch: ${JSON.stringify(validate.errors)}`);
 assert.equal(response.headers.get('cache-control'), 'no-store');
 if (response.ok && operation.requestBody && typeof init?.body === 'string') {
  const bodySchema = operation.requestBody.content['application/json'].schema;
  const validateBody = validator.compile({ $ref: `auth-contract${bodySchema.$ref}` });
  assert.ok(validateBody(JSON.parse(init.body)), `Contract request mismatch: ${JSON.stringify(validateBody.errors)}`);
 }
 return response;
}
