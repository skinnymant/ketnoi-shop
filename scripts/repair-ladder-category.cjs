// Repair only the six known products imported into Thang Nhôm by mistake.
// From api/: node ../scripts/repair-ladder-category.cjs          (read-only)
//            node ../scripts/repair-ladder-category.cjs --apply (transaction)
// Requires DATABASE_URL for the intended database. Never runs the catalog seed.

const CATEGORY_BY_SKU = Object.freeze({
  '48-22-3078': 'cong-cu-dung-cu',
  '48-22-6109': 'cong-cu-dung-cu',
  TACSD30316: 'cong-cu-dung-cu',
  '2155': 'phu-tung-linh-kien',
  '26708': 'cong-cu-dung-cu',
  '09261': 'cong-cu-dung-cu',
});
const LADDER_SLUGS = [
  'thang-nhom',
  'thang-nhom-chu-a',
  'thang-nhom-rut',
  'thang-nhom-ghe',
];

async function repairLadderCategory(prisma, { apply = false } = {}) {
  const categories = await prisma.category.findMany({
    where: {
      slug: { in: [...LADDER_SLUGS, ...new Set(Object.values(CATEGORY_BY_SKU))] },
      deletedAt: null,
    },
    select: { id: true, slug: true, isActive: true },
  });
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const ladderIds = categories
    .filter((category) => LADDER_SLUGS.includes(category.slug))
    .map((category) => category.id);
  const products = await prisma.product.findMany({
    where: {
      sku: { in: Object.keys(CATEGORY_BY_SKU) },
      categoryId: { in: ladderIds },
      deletedAt: null,
    },
    select: { id: true, sku: true, name: true, categoryId: true },
  });
  const plan = products.map((product) => {
    const destinationSlug = CATEGORY_BY_SKU[product.sku];
    const destination = bySlug.get(destinationSlug);
    if (!destination?.isActive) {
      throw new Error(`Missing active destination category: ${destinationSlug}`);
    }
    return {
      ...product,
      destinationSlug,
      destinationId: destination.id,
    };
  });

  if (apply && plan.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const product of plan) {
        const result = await tx.product.updateMany({
          where: {
            id: product.id,
            sku: product.sku,
            categoryId: product.categoryId,
            deletedAt: null,
          },
          data: { categoryId: product.destinationId },
        });
        if (result.count !== 1) {
          throw new Error(`Product changed during repair; retry: ${product.sku}`);
        }
      }
    });
  }
  return plan;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('From api/: node ../scripts/repair-ladder-category.cjs [--apply]');
    console.log('Default: read-only preview. --apply: update only the listed product categories.');
    return;
  }
  if (args.some((arg) => arg !== '--apply')) {
    throw new Error('Unknown argument. Use --help for usage.');
  }
  require('../api/node_modules/dotenv').config({ quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const { PrismaPg } = require('../api/node_modules/@prisma/adapter-pg');
  const { PrismaClient } = require('../api/node_modules/@prisma/client');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const apply = args.includes('--apply');
    const plan = await repairLadderCategory(prisma, { apply });
    console.table(plan.map(({ sku, name, destinationSlug }) => ({ sku, name, destinationSlug })));
    console.log(`${apply ? 'Updated' : 'Dry run; would update'} ${plan.length} product(s).`);
    if (!apply) console.log('No data changed. Review the preview before running with --apply.');
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { CATEGORY_BY_SKU, repairLadderCategory };
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
