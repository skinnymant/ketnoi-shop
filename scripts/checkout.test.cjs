const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../ketnoi-shop/web/node_modules/typescript');

// Run the actual pure TypeScript handlers without starting Next or using a DB.
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name),
    module, module.exports,
  );
  return module.exports;
}
const root = path.resolve(__dirname, '../ketnoi-shop/web');
const { parseCheckoutInput, createCheckoutReceipt, handleCheckout } = load(path.join(root, 'lib/checkout.ts'));
const { SWE_BANK } = load(path.join(root, 'lib/merchant-bank.ts'));
const { GET } = load(path.join(root, 'app/api/checkout/route.ts'));

const input = { receiverName: 'Local test', receiverPhone: '0900000000', shippingAddress: 'Local test only',
  paymentMethod: 'BANK_TRANSFER', items: [{ productId: 'fixture-only', quantity: 2 }] };
function order(overrides = {}) {
  return { id: 'saved-order', orderCode: 'KN20261009-9999', total: '230000',
    payments: [{ id: 'payment', orderId: 'saved-order', method: 'BANK_TRANSFER', status: 'PENDING', amount: '230000' }],
    ...overrides };
}
function request(body = input, headers = {}) {
  return new Request('https://store.test/api/checkout', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://store.test', ...headers }, body: JSON.stringify(body) });
}

test('GET exposes only the approved MB recipient with no caching', async () => {
  const result = GET();
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await result.json(), { bankTransfer: { bankCode: '970422', accountNumber: '6605666888', accountName: 'CONG TY TNHH THUONG MAI VA DICH SWE' } });
});
test('input whitelist ignores browser supplied prices, recipient and paid status', () => {
  assert.deepEqual(parseCheckoutInput({ ...input, total: 1, bankTransfer: { accountNumber: 'evil' }, status: 'PAID',
    items: [{ ...input.items[0], unitPrice: 1 }] }), input);
});
for (const [label, patch] of [
  ['empty cart', { items: [] }], ['fractional quantity', { items: [{ productId: 'p', quantity: 1.5 }] }],
  ['negative quantity', { items: [{ productId: 'p', quantity: -2 }] }], ['unknown method', { paymentMethod: 'PAID' }],
  ['duplicate products', { items: [input.items[0], input.items[0]] }], ['missing address', { shippingAddress: '' }],
  ['invalid email', { receiverEmail: 'invalid' }], ['oversized note', { note: 'x'.repeat(2001) }],
]) test(`rejects ${label}`, () => assert.equal(parseCheckoutInput({ ...input, ...patch }), null));

test('legacy saved pending bank order receives approved recipient and upstream total/code', () => {
  assert.deepEqual(createCheckoutReceipt(order(), 'BANK_TRANSFER'), { orderCode: 'KN20261009-9999', total: '230000', paymentMethod: 'BANK_TRANSFER', bankTransfer: SWE_BANK, paymentReviewRequired: false });
});
test('matching new backend snapshot is accepted', () => {
  assert.deepEqual(createCheckoutReceipt(order({ bankTransfer: SWE_BANK }), 'BANK_TRANSFER').bankTransfer, SWE_BANK);
});
for (const [label, patch] of [
  ['explicitly disabled snapshot', { bankTransfer: null }], ['malformed snapshot', { bankTransfer: {} }],
  ['conflicting account', { bankTransfer: { ...SWE_BANK, accountNumber: 'OTHER' } }],
  ['conflicting bank', { bankTransfer: { ...SWE_BANK, bankCode: '970436' } }],
  ['conflicting holder', { bankTransfer: { ...SWE_BANK, accountName: 'OTHER' } }],
  ['missing payments', { payments: [] }], ['two payments', { payments: [...order().payments, ...order().payments] }],
  ['wrong payment order', { payments: [{ ...order().payments[0], orderId: 'other' }] }],
  ['wrong method', { payments: [{ ...order().payments[0], method: 'COD' }] }],
  ['already paid', { payments: [{ ...order().payments[0], status: 'PAID' }] }],
  ['wrong amount', { payments: [{ ...order().payments[0], amount: '1' }] }],
  ['amount too large for QR', { total: '10000000000000', payments: [{ ...order().payments[0], amount: '10000000000000' }] }],
]) test(`preserves known order but hides QR for ${label}`, () => {
  const receipt = createCheckoutReceipt(order(patch), 'BANK_TRANSFER');
  assert.equal(receipt.orderCode, 'KN20261009-9999');
  assert.equal(receipt.bankTransfer, null);
  assert.equal(receipt.paymentReviewRequired, true);
});
for (const bad of [null, {}, order({ total: '-1' }), order({ total: 'NaN' }), order({ total: '1.5' }), order({ id: '' }), order({ orderCode: '<script>' })]) {
  test(`malformed order has no receipt: ${JSON.stringify(bad)}`, () => assert.equal(createCheckoutReceipt(bad, 'BANK_TRANSFER'), null));
}
test('COD retains server total and never gets a bank recipient', () => {
  const receipt = createCheckoutReceipt(order({ payments: [{ ...order().payments[0], method: 'COD' }] }), 'COD');
  assert.equal(receipt.paymentMethod, 'COD'); assert.equal(receipt.total, '230000');
  assert.equal(receipt.bankTransfer, null); assert.equal(receipt.paymentReviewRequired, false);
});
test('POST forwards safe fields and customer token only to fixed API', async () => {
  let calls = 0;
  const result = await handleCheckout(request({ ...input, total: 1 }, { Authorization: 'Bearer fixture-token' }), 'https://backend.test', async (url, options) => {
    calls++;
    assert.equal(url, 'https://backend.test/orders'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer fixture-token');
    assert.deepEqual(JSON.parse(options.body), input);
    return Response.json(order(), { status: 201 });
  });
  assert.equal(calls, 1); assert.equal(result.status, 201);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await result.json()).total, '230000');
});
for (const status of [400, 401, 403, 429, 500, 502, 504]) test(`upstream ${status}: never retries or changes bank method to COD`, async () => {
  let calls = 0;
  const result = await handleCheckout(request(), 'https://backend.test', async (_, opts) => {
    calls++; assert.equal(JSON.parse(opts.body).paymentMethod, 'BANK_TRANSFER');
    return Response.json({ message: 'upstream test' }, { status });
  });
  const data = await result.json();
  assert.equal(calls, 1); assert.equal(data.bankTransfer, undefined);
  assert.equal(data.orderUncertain === true, status >= 500);
  assert.equal(result.status, status >= 500 ? 502 : status);
});
test('network failure may have created an order and requires review', async () => {
  const result = await handleCheckout(request(), 'https://backend.test', async () => { throw new Error('timeout'); });
  assert.equal((await result.json()).orderUncertain, true);
});
test('malformed success retains any known code in the uncertain response', async () => {
  const result = await handleCheckout(request(), 'https://backend.test', async () => Response.json({ orderCode: 'KN20261009-9999' }));
  const data = await result.json();
  assert.equal(data.orderCode, 'KN20261009-9999'); assert.equal(data.orderUncertain, true);
});
test('cross origin and invalid cart requests never reach backend', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls++; throw new Error('must not call'); };
  assert.equal((await handleCheckout(request(input, { Origin: 'https://evil.test' }), 'https://backend.test', fakeFetch)).status, 403);
  assert.equal((await handleCheckout(request({ ...input, items: [] }), 'https://backend.test', fakeFetch)).status, 400);
  assert.equal(calls, 0);
});
test('uses public Host when Next request URL contains the internal listener host', async () => {
  const req = new Request('http://localhost:3339/api/checkout', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Host: '127.0.0.1:3339', Origin: 'http://127.0.0.1:3339' }, body: JSON.stringify(input) });
  const res = await handleCheckout(req, 'https://backend.test', async () => Response.json(order(), { status: 201 }));
  assert.equal(res.status, 201);
});
