import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Controller, Get, UnprocessableEntityException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApiHttp } from '../src/common/http/api-http.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SIGNING_KEY = '11'.repeat(32);
process.env.CSRF_HMAC_KEY = '22'.repeat(32);
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';
process.env.JWT_KEY_ID = 'test-key';
process.env.PUBLIC_ORIGIN = 'https://test.example';

@Controller('probe')
class ProbeController {
  @Get()
  read() { return { value_vnd: '9007199254740993' }; }

  @Get('list')
  list() { return { data: [{ id: '1' }], page: { next_cursor: null, has_more: false } }; }

  @Get('invalid')
  invalid(): never {
    throw new UnprocessableEntityException({
      code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.',
      field_errors: [{ path: 'quantity', code: 'MIN_VALUE', message: 'Quantity must be at least 1.' }],
      details: {},
    });
  }
}

describe('HTTP foundation', () => {
  let app: INestApplication | undefined;
  let baseUrl: string;

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule], controllers: [ProbeController],
    }).overrideProvider(PrismaService).useValue({}).compile();
    app = module.createNestApplication();
    configureApiHttp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  after(async () => { await app?.close(); });

  it('serves only the versioned path and envelopes exact strings', async () => {
    const response = await fetch(`${baseUrl}/api/v1/probe`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { value_vnd: '9007199254740993' } });
    assert.equal((await fetch(`${baseUrl}/probe`)).status, 404);
    const list = await fetch(`${baseUrl}/api/v1/probe/list`, { signal: AbortSignal.timeout(5000) });
    assert.deepEqual(await list.json(), {
      data: [{ id: '1' }], page: { next_cursor: null, has_more: false },
    });
  });

  it('returns the stable error envelope with request reference', async () => {
    const response = await fetch(`${baseUrl}/api/v1/probe/invalid`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 422);
    const body = await response.json() as { error: Record<string, unknown> };
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.deepEqual(body.error.field_errors, [
      { path: 'quantity', code: 'MIN_VALUE', message: 'Quantity must be at least 1.' },
    ]);
    assert.deepEqual(body.error.details, {});
    assert.equal(body.error.retryable, false);
    assert.equal(body.error.request_id, response.headers.get('x-request-id'));
  });

  it('keeps removed routes at 404 and envelopes unknown API routes', async () => {
    for (const path of ['/', '/todos']) {
      const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 404);
    }
    const response = await fetch(`${baseUrl}/api/v1/missing-route`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 404);
    const body = await response.json() as { error: { code: string; field_errors: unknown[] } };
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.deepEqual(body.error.field_errors, []);
  });

  it('enforces session, Origin, JSON and public role boundaries', async () => {
    const me = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(me.status, 401);
    assert.equal((await me.json() as { error: { code: string } }).error.code, 'TOKEN_INVALID');

    const registration = { login_identifier: 'student-one', password: 'correct horse battery staple',
      display_name: 'Student One', role: 'admin' };
    const wrongOrigin = await fetch(`${baseUrl}/api/v1/auth/register`, { method: 'POST',
      headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
      body: JSON.stringify(registration) });
    assert.equal(wrongOrigin.status, 403);
    const wrongType = await fetch(`${baseUrl}/api/v1/auth/register`, { method: 'POST',
      headers: { origin: 'https://test.example', 'content-type': 'text/plain' }, body: '{}' });
    assert.equal(wrongType.status, 400);
    const roleOverride = await fetch(`${baseUrl}/api/v1/auth/register`, { method: 'POST',
      headers: { origin: 'https://test.example', 'content-type': 'application/json' },
      body: JSON.stringify(registration) });
    assert.equal(roleOverride.status, 422);
  });
});
