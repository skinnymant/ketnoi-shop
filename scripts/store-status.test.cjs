const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../ketnoi-shop/web/node_modules/typescript');
const root = path.resolve(__dirname, '../ketnoi-shop/web');

function load(relative, deps = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Response, AbortSignal, URLSearchParams,
    process: { env: {} }, require: (name) => {
      if (Object.hasOwn(deps, name)) return deps[name];
      throw new Error(`Unexpected dependency: ${name}`);
    }, ...globals });
  return exports;
}

test('live health verifies DB and requests no-cache with bounded timeout', async () => {
  let called;
  const api = load('lib/store-status.ts', {}, { fetch: async (...args) => {
    called = args;
    return Response.json({ status: 'ok', database: 'connected', capabilities: { effectivePriceFilters: true, productFreeShipping: true } });
  } });
  const status = await api.probeStoreStatus('https://backend.test/');
  assert.equal(status.available, true);
  assert.equal(status.capabilities.productFreeShipping, true);
  assert.equal(status.capabilities.effectivePriceFilters, true);
  assert.equal(called[0], 'https://backend.test/health');
  assert.equal(called[1].cache, 'no-store');
  assert.equal(called[1].redirect, 'error');
  assert(called[1].signal instanceof AbortSignal);
});

test('legacy health permits orders but never claims new pricing capabilities', async () => {
  const api = load('lib/store-status.ts', {}, { fetch: async () => Response.json({ status: 'ok', database: 'connected' }) });
  const status = await api.probeStoreStatus('https://backend.test');
  assert.equal(status.available, true);
  assert.equal(status.capabilities.productFreeShipping, false);
  assert.equal(status.capabilities.effectivePriceFilters, false);
});

for (const [name, value] of [
  ['DB disconnected', { status: 'ok', database: 'disconnected', capabilities: { productFreeShipping: true } }],
  ['missing DB', { status: 'ok' }], ['unknown contract', { available: true }], ['array', []], ['null', null],
]) test(`fails closed on ${name}`, async () => {
  const api = load('lib/store-status.ts', {}, { fetch: async () => Response.json(value) });
  const status = await api.probeStoreStatus('https://backend.test');
  assert.equal(status.available, false);
  assert.equal(status.capabilities.productFreeShipping, false);
});

for (const [name, fetch] of [
  ['Cloudflare error', async () => new Response('error 1033', { status: 530 })],
  ['invalid JSON', async () => new Response('<html>proxy login</html>')],
  ['timeout/network error', async () => { throw new Error('timeout'); }],
]) test(`fails closed on ${name}`, async () => {
  const api = load('lib/store-status.ts', {}, { fetch });
  assert.equal(await api.probeStoreAvailability('https://backend.test'), false);
});

test('capabilities require literal true', async () => {
  const api = load('lib/store-status.ts', {}, { fetch: async () => Response.json({
    status: 'ok', database: 'connected', capabilities: { effectivePriceFilters: 'true', productFreeShipping: 1 },
  }) });
  const status = await api.probeStoreStatus('https://backend.test');
  assert.equal(status.available, true);
  assert.equal(status.capabilities.productFreeShipping, false);
});

test('status route returns 503 and retry guidance without upstream details', async () => {
  const status = { available: false, capabilities: { effectivePriceFilters: false, productFreeShipping: false } };
  const route = load('app/api/store-status/route.ts', {
    '@/lib/api': { API_BASE: 'https://private-origin.test' },
    '@/lib/store-status': { probeStoreStatus: async () => status },
  });
  const response = await route.GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('retry-after'), '60');
  assert.deepEqual(await response.json(), status);
});

test('catalogue fetch has bounded wait and a typed 404 distinct from outages', async () => {
  let options;
  let nextStatus = 404;
  const api = load('lib/api.ts', {
    './product-images': { withProductImages: (p) => p },
    './product-content': { withProductContent: (p) => p },
    './seo': { SITE_URL: 'https://www.swevietnam.com' },
    react: { cache: (fn) => fn },
  }, { fetch: async (_, opts) => { options = opts; return new Response('', { status: nextStatus }); } });
  await assert.rejects(api.getProduct('missing'), (error) => error instanceof api.ApiRequestError && error.status === 404);
  nextStatus = 530;
  await assert.rejects(api.getProduct('existing'), (error) => error instanceof api.ApiRequestError && error.status === 530);
  assert.equal(options.next.revalidate, 60);
  assert(options.signal instanceof AbortSignal);
});
