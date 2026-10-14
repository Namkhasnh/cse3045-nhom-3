import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('HTTP server', () => {
  let app: INestApplication | undefined;
  let baseUrl: string;

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(PrismaService).useValue({}).compile();

    app = module.createNestApplication();
    // Let the OS choose a free port; tests do not occupy port 3000.
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  after(async () => {
    await app?.close();
  });

  it('GET / returns 404 because no controller is registered', async () => {
    const response = await fetch(`${baseUrl}/`, {
      signal: AbortSignal.timeout(5000),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      message: 'Cannot GET /',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('an unknown route returns 404', async () => {
    const response = await fetch(`${baseUrl}/missing-route`, {
      signal: AbortSignal.timeout(5000),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      message: 'Cannot GET /missing-route',
      error: 'Not Found',
      statusCode: 404,
    });
  });
});
