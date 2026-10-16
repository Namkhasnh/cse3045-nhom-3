const MAX_BIGINT = 9223372036854775807n;
const MIN_BIGINT = -9223372036854775808n;
const MAX_RATE = 100000000n;

export function parseId(value: unknown): bigint {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw new RangeError('ID must be a positive canonical decimal string.');
  }
  const parsed = BigInt(value);
  if (parsed > MAX_BIGINT) throw new RangeError('ID exceeds signed BIGINT.');
  return parsed;
}

export function parseMoney(value: unknown, options: { min?: bigint; max?: bigint } = {}): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(value)) {
    throw new RangeError('Money must be a canonical integer string.');
  }
  const parsed = BigInt(value);
  if (parsed < (options.min ?? MIN_BIGINT) || parsed > (options.max ?? MAX_BIGINT)) {
    throw new RangeError('Money is outside the allowed range.');
  }
  return parsed;
}

export function parseRate(value: unknown): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)\.[0-9]{8}$/.test(value)) {
    throw new RangeError('Rate must have exactly eight decimal places.');
  }
  const [whole, fraction] = value.split('.');
  const scaled = BigInt(whole) * MAX_RATE + BigInt(fraction);
  if (scaled > MAX_RATE) throw new RangeError('Rate exceeds the business maximum.');
  return scaled;
}

export function checkedMoney(value: bigint): string {
  if (value < MIN_BIGINT || value > MAX_BIGINT) throw new RangeError('Money exceeds signed BIGINT.');
  return value.toString();
}

export function idToWire(value: bigint): string {
  if (value < 1n || value > MAX_BIGINT) throw new RangeError('ID exceeds signed BIGINT.');
  return value.toString();
}
