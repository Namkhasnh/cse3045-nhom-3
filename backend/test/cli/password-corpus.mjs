// Loaded only by the disposable CLI harness. Production has no bypass setting.
const original = globalThis.fetch;
globalThis.fetch = (url, options) => {
  if (String(url).startsWith('https://api.pwnedpasswords.com/range/')) {
    return Promise.resolve(new Response(`${'0'.repeat(35)}:0\r\n`));
  }
  return original(url, options);
};
