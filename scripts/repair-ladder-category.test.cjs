const assert = require('node:assert/strict');
const test = require('node:test');
const { CATEGORY_BY_SKU, repairLadderCategory } = require('./repair-ladder-category.cjs');

function fixture() {
  const categories = [
    { id: 'ladder', slug: 'thang-nhom', isActive: true },
    { id: 'ladder-child', slug: 'thang-nhom-rut', isActive: true },
    { id: 'tools', slug: 'cong-cu-dung-cu', isActive: true },
    { id: 'parts', slug: 'phu-tung-linh-kien', isActive: true },
  ];
  let products = [
    ...Object.keys(CATEGORY_BY_SKU).map((sku, index) => ({
      id: sku, sku, name: sku, categoryId: index === 0 ? 'ladder-child' : 'ladder', deletedAt: null,
    })),
    { id: 'real', sku: 'REAL-LADDER', name: 'Thang nhôm', categoryId: 'ladder', deletedAt: null },
    { id: 'deleted', sku: '48-22-3078', name: 'Deleted item', categoryId: 'ladder', deletedAt: '2026-01-01' },
  ];
  const state = { categories, writes: 0, transactions: 0, failSku: null, products: () => products };
  const matches = (product, where) => Object.entries(where).every(([key, value]) =>
    value?.in ? value.in.includes(product[key]) : product[key] === value,
  );
  const prisma = {
    category: { findMany: async () => categories },
    product: { findMany: async ({ where }) => products.filter((product) => matches(product, where)) },
    $transaction: async (callback) => {
      state.transactions += 1;
      const before = structuredClone(products);
      try {
        return await callback({ product: { updateMany: async ({ where, data }) => {
          assert.deepEqual(Object.keys(data), ['categoryId']);
          assert.ok(Object.hasOwn(CATEGORY_BY_SKU, where.sku));
          state.writes += 1;
          if (state.failSku === where.sku) return { count: 0 };
          const affected = products.filter((product) => matches(product, where));
          affected.forEach((product) => Object.assign(product, data));
          return { count: affected.length };
        } } });
      } catch (error) {
        products = before;
        throw error;
      }
    },
  };
  return { prisma, state };
}

test('dry run plans only the six known misplaced SKUs and never writes', async () => {
  const { prisma, state } = fixture();
  const plan = await repairLadderCategory(prisma);
  assert.equal(plan.length, 6);
  assert.equal(plan.find((product) => product.sku === '2155').destinationSlug, 'phu-tung-linh-kien');
  assert.equal(state.writes, 0);
  assert.equal(state.transactions, 0);
});

test('apply changes categories only, preserves unrelated/deleted products, and is idempotent', async () => {
  const { prisma, state } = fixture();
  assert.equal((await repairLadderCategory(prisma, { apply: true })).length, 6);
  assert.equal(state.writes, 6);
  assert.equal(state.transactions, 1);
  assert.equal(state.products().find((product) => product.id === 'real').categoryId, 'ladder');
  assert.equal(state.products().find((product) => product.id === 'deleted').categoryId, 'ladder');
  assert.deepEqual(await repairLadderCategory(prisma, { apply: true }), []);
  assert.equal(state.writes, 6);
});

test('missing or inactive destination aborts before any write', async () => {
  for (const inactive of [false, true]) {
    const { prisma, state } = fixture();
    if (inactive) state.categories.find((category) => category.id === 'parts').isActive = false;
    else state.categories.splice(state.categories.findIndex((category) => category.id === 'parts'), 1);
    await assert.rejects(repairLadderCategory(prisma, { apply: true }), /Missing active destination/);
    assert.equal(state.writes, 0);
  }
});

test('concurrent product change aborts and rolls back the complete transaction', async () => {
  const { prisma, state } = fixture();
  const before = structuredClone(state.products());
  state.failSku = '48-22-6109';
  await assert.rejects(repairLadderCategory(prisma, { apply: true }), /Product changed during repair/);
  assert.deepEqual(state.products(), before);
});
