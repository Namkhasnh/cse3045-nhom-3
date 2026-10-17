import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProfileController } from './profile.controller.js';
import type { AuthRequest } from './session.guard.js';

test('profile rejects actor override and invalid version before service call', async () => {
  let called = false;
  const controller = new ProfileController({ updateProfile: async () => { called = true; return {}; } } as never);
  const request = { authAccount: { id: 3n } } as AuthRequest;
  await assert.rejects(() => controller.update({ expected_version: 1, display_name: 'A', user_id: '4' }, request));
  await assert.rejects(() => controller.update({ expected_version: 0, display_name: 'A' }, request));
  assert.equal(called, false);
});
