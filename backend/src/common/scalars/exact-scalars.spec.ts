import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkedMoney, idToWire, parseId, parseMoney, parseRate } from './exact-scalars.js';

test('canonical IDs keep values beyond JavaScript safe integer precision', () => {
  const id = parseId('9007199254740993');
  assert.equal(idToWire(id), '9007199254740993');
  for (const input of ['0', '01', '-1', '1e3', 1, '9223372036854775808']) {
    assert.throws(() => parseId(input));
  }
});

test('money stays exact and bounded without Number conversion', () => {
  assert.equal(parseMoney('-9007199254740993'), -9007199254740993n);
  assert.equal(checkedMoney(9007199254740993n), '9007199254740993');
  assert.throws(() => parseMoney('1.00'));
  assert.throws(() => parseMoney('01'));
  assert.throws(() => parseMoney('-0'));
  assert.throws(() => checkedMoney(9223372036854775808n));
  assert.throws(() => parseMoney('0', { min: 1n }));
});

test('rates require eight places and enforce the business ceiling', () => {
  assert.equal(parseRate('0.10000000'), 10000000n);
  assert.equal(parseRate('1.00000000'), 100000000n);
  for (const input of ['0.1', '1.00000001', '01.00000000', 0.1]) {
    assert.throws(() => parseRate(input));
  }
});
