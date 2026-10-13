const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '../ketnoi-shop/web');
const ts = require(path.join(project, 'node_modules/typescript'));

function load(relativePath, dependencies = {}, extra = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(project, relativePath), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, URL, Response, TextDecoder, Uint8Array, console,
    require: (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected import: ${name}`);
    },
    ...extra,
  });
  return exports;
}

const metrics = load('lib/metrics.ts');
const origin = 'https://www.swevietnam.com';
const validEvent = { type: 'event', routeGroup: 'checkout', event: 'order_created', count: 1 };
function request(payload, headers = {}, url = `${origin}/api/metrics`) {
  return new Request(url, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}
function options(logs = []) {
  return { allowedOrigins: [origin], log: (sample) => logs.push(sample), takeBudget: () => true };
}

test('only allowlisted anonymous fields and bounded values enter logging', async () => {
  const logs = [];
  for (const forbidden of ['path', 'sku', 'query', 'orderId', 'email', 'phone', 'cookie', 'token', 'id']) {
    const response = await metrics.handleMetricsRequest(request({ ...validEvent, [forbidden]: 'private' }), options(logs));
    assert.equal(response.status, 400);
  }
  for (const count of [0, -1, 21, 1.5, '1', null]) {
    assert.equal(metrics.parseMetricPayload({ ...validEvent, count }), null);
  }
  for (const value of [-1, Infinity, NaN, 120001]) {
    assert.equal(metrics.parseMetricPayload({ type: 'vital', routeGroup: 'product', metric: 'LCP', value, rating: 'poor' }), null);
  }
  assert.equal(logs.length, 0);
  const response = await metrics.handleMetricsRequest(request(validEvent), options(logs));
  assert.equal(response.status, 204);
  assert.deepEqual(JSON.parse(JSON.stringify(logs)), [validEvent]);
});

test('unknown events, metrics, groups and non-record input are rejected', () => {
  for (const input of [null, [], 1, { ...validEvent, event: 'payment_success' },
    { ...validEvent, routeGroup: '/thanh-toan?email=private' },
    { type: 'vital', routeGroup: 'home', metric: 'custom', value: 1, rating: 'good' },
    { type: 'vital', routeGroup: 'home', metric: 'CLS', value: 10.1, rating: 'poor' },
    { type: 'vital', routeGroup: 'home', metric: 'CLS', value: 0.02, rating: 'unknown' }]) {
    assert.equal(metrics.parseMetricPayload(input), null);
  }
  for (const metric of ['LCP', 'INP', 'CLS', 'TTFB', 'FCP']) {
    assert(metrics.parseMetricPayload({ type: 'vital', routeGroup: 'home', metric, value: 0, rating: 'good' }));
  }
});

test('foreign, missing and untrusted same Origin requests fail without logging', async () => {
  const logs = [];
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { origin: 'https://foreign.example' }), options(logs))).status, 403);
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { origin: '' }), options(logs))).status, 403);
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { origin: 'https://spoof.example' }, 'https://spoof.example/api/metrics'), options(logs))).status, 403);
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { 'sec-fetch-site': 'cross-site' }), options(logs))).status, 403);
  assert.equal(logs.length, 0);
});

test('DNT and Global Privacy Control stop valid server collection', async () => {
  const logs = [];
  for (const headers of [{ dnt: '1' }, { 'sec-gpc': '1' }]) {
    assert.equal((await metrics.handleMetricsRequest(request(validEvent, headers), options(logs))).status, 204);
  }
  assert.equal(logs.length, 0);
});

test('internal Next listener uses only explicitly allowed public Host, not forwarding headers', async () => {
  const logs = [];
  const proxied = request(validEvent, { host: 'www.swevietnam.com' }, 'http://localhost:3000/api/metrics');
  assert.equal((await metrics.handleMetricsRequest(proxied, options(logs))).status, 204);
  assert.equal(logs.length, 1);
  const spoofedHost = request(validEvent, { host: 'foreign.example', 'x-forwarded-host': 'www.swevietnam.com' });
  assert.equal((await metrics.handleMetricsRequest(spoofedHost, options(logs))).status, 403);
  assert.equal(logs.length, 1);
  const foreignOrigin = request(validEvent, { origin: 'https://foreign.example', host: 'foreign.example' }, 'http://localhost:3000/api/metrics');
  assert.equal((await metrics.handleMetricsRequest(foreignOrigin, options(logs))).status, 403);
  assert.equal(logs.length, 1);
});

test('actual streamed body bound works even without Content-Length', async () => {
  const logs = [];
  const oversized = JSON.stringify({ ...validEvent, path: 'x'.repeat(1500) });
  assert.equal((await metrics.handleMetricsRequest(request(oversized), options(logs))).status, 413);
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { 'content-length': '2048' }), options(logs))).status, 413);
  assert.equal((await metrics.handleMetricsRequest(request('{malformed'), options(logs))).status, 400);
  assert.equal((await metrics.handleMetricsRequest(request(validEvent, { 'content-type': 'text/plain' }), options(logs))).status, 415);
  assert.equal(logs.length, 0);
});

test('exhausted request budget rejects sampling without logging', async () => {
  const logs = [];
  const response = await metrics.handleMetricsRequest(request(validEvent), { ...options(logs), takeBudget: () => false });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(logs.length, 0);
  const fresh = load('lib/metrics.ts');
  for (let i = 0; i < 120; i += 1) assert.equal(fresh.takeMetricBudget(100000), true);
  assert.equal(fresh.takeMetricBudget(100001), false);
  assert.equal(fresh.takeMetricBudget(160000), true);
});

test('browser sender omits credentials and Referrer and sends only a route group', () => {
  const sends = [];
  const browser = { doNotTrack: null, globalPrivacyControl: false };
  const location = { pathname: '/san-pham/private-model-code', href: `${origin}/san-pham/private-model-code?query=private` };
  const client = load('lib/metrics-client.ts', { './metrics': metrics }, {
    window: { location }, navigator: browser,
    fetch: (url, init) => { sends.push({ url, init }); return Promise.resolve(new Response(null, { status: 204 })); },
  });
  client.trackStoreEvent('add_to_cart');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].url, '/api/metrics');
  assert.equal(sends[0].init.credentials, 'omit');
  assert.equal(sends[0].init.referrerPolicy, 'no-referrer');
  assert.equal(sends[0].init.keepalive, true);
  assert.deepEqual(JSON.parse(sends[0].init.body), { type: 'event', routeGroup: 'product', event: 'add_to_cart', count: 1 });
  assert(!sends[0].init.body.includes('private'));
  browser.doNotTrack = '1'; client.trackStoreEvent('add_to_cart');
  browser.doNotTrack = null; browser.globalPrivacyControl = true; client.trackStoreEvent('add_to_cart');
  assert.equal(sends.length, 1);
  browser.globalPrivacyControl = false; location.pathname = '/admin/san-pham'; client.trackStoreEvent('add_to_cart');
  assert.equal(sends.length, 1);
  location.pathname = '/thanh-toan';
  for (let i = 0; i < 120; i += 1) client.trackStoreEvent('begin_checkout');
  assert.equal(sends.length, 100);
});

test('CLS keeps its unit and timestamps/entries/IDs are discarded', () => {
  const sends = [];
  const client = load('lib/metrics-client.ts', { './metrics': metrics }, {
    window: { location: { pathname: '/' } }, navigator: {},
    fetch: (_url, init) => { sends.push(JSON.parse(init.body)); return Promise.resolve(new Response(null, { status: 204 })); },
  });
  client.sendWebVital({ name: 'CLS', value: 0.1234567, rating: 'needs-improvement', id: 'private', entries: ['private'] }, 'home');
  assert.deepEqual(sends, [{ type: 'vital', routeGroup: 'home', metric: 'CLS', value: 0.1235, rating: 'needs-improvement' }]);
});
