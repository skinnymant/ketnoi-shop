import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  categoryId: string;
  brand: { name: string; slug: string };
  specs: { specName: string; specValue: string }[];
};
type Range = { gte?: number; lte?: number; lt?: unknown };
type Filter = {
  id?: { in: string[] };
  categoryId?: { in: string[] };
  brand?: { slug: string };
  price?: Range;
  salePrice?: Range | null;
  OR?: Filter[];
  AND?: Filter[];
  specs?: { some: { specName: string; specValue: string } };
};
const priceField = { name: 'price' };
const inRange = (value: number | null, range: Range) =>
  value !== null &&
  (range.gte === undefined || value >= range.gte) &&
  (range.lte === undefined || value <= range.lte);
function matches(product: Product, filter: Filter): boolean {
  return (
    (!filter.id || filter.id.in.includes(product.id)) &&
    (!filter.categoryId || filter.categoryId.in.includes(product.categoryId)) &&
    (!filter.brand || filter.brand.slug === product.brand.slug) &&
    (!filter.price || inRange(product.price, filter.price)) &&
    (filter.salePrice === undefined ||
      (filter.salePrice === null
        ? product.salePrice === null
        : inRange(product.salePrice, filter.salePrice) &&
          (filter.salePrice.lt !== priceField ||
            product.salePrice! < product.price))) &&
    (!filter.OR || filter.OR.some((part) => matches(product, part))) &&
    (!filter.AND || filter.AND.every((part) => matches(product, part))) &&
    (!filter.specs ||
      product.specs.some(
        (spec) =>
          spec.specName === filter.specs!.some.specName &&
          spec.specValue === filter.specs!.some.specValue,
      ))
  );
}
const product = (
  id: string,
  price: number,
  salePrice: number | null = null,
): Product => ({
  id,
  name: id,
  sku: id,
  price,
  salePrice,
  categoryId: 'cat',
  brand: { name: 'Bosch', slug: 'bosch' },
  specs: [{ specName: 'Điện áp', specValue: '18V' }],
});

function fixture(
  products: Product[],
  searchIds: string[] = products.map(({ id }) => id),
) {
  let countFilter: Filter = {};
  const sqlQueries: Prisma.Sql[] = [];
  const findMany = jest.fn(
    ({
      where,
      skip,
      take,
    }: {
      where: Filter;
      skip?: number;
      take?: number;
    }) => {
      const rows = products.filter((item) => matches(item, where));
      return Promise.resolve(
        skip === undefined
          ? rows
          : rows.slice(skip, skip + (take ?? rows.length)),
      );
    },
  );
  const tx = {
    product: {
      fields: { price: priceField },
      count: jest.fn(({ where }: { where: Filter }) => {
        countFilter = where;
        return Promise.resolve(
          products.filter((item) => matches(item, where)).length,
        );
      }),
      findMany,
    },
    $queryRaw: jest.fn(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        const sql = Prisma.sql(strings, ...values);
        sqlQueries.push(sql);
        // Model the SQL result separately from Prisma hydration: SQL orders before
        // pagination, while findMany deliberately returns its original row order.
        const direction = /\) DESC/.test(sql.sql) ? -1 : 1;
        const limit = Number(sql.values.at(-2));
        const offset = Number(sql.values.at(-1));
        return Promise.resolve(
          products
            .filter((item) => matches(item, countFilter))
            .sort(
              (a, b) =>
                direction *
                  ((a.salePrice ?? a.price) - (b.salePrice ?? b.price)) ||
                a.id.localeCompare(b.id),
            )
            .slice(offset, offset + limit)
            .map(({ id }) => ({ id })),
        );
      },
    ),
  };
  const prisma = {
    product: tx.product,
    category: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'cat',
        children: [{ id: 'child', children: [] }],
      }),
    },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue(searchIds.map((id) => ({ id }))),
    $transaction: jest.fn(
      (input: ((client: typeof tx) => unknown) | Promise<unknown>[]) =>
        typeof input === 'function' ? input(tx) : Promise.all(input),
    ),
  };
  return {
    service: new ProductsService(prisma as unknown as PrismaService),
    prisma,
    tx,
    sqlQueries,
  };
}

describe('effective product prices', () => {
  it('price ranges include ordinary prices and compare discounted products by salePrice', async () => {
    const { service } = fixture([
      product('regular', 100),
      product('discount-in-range', 900, 150),
      product('discount-outside', 150, 50),
      product('outside', 300),
    ]);
    const result = await service.findAll({ minPrice: 100, maxPrice: 200 });
    expect(result.data.map(({ id }) => id)).toEqual([
      'regular',
      'discount-in-range',
    ]);
    expect(result.meta.total).toBe(2);
  });

  it.each(['price_asc', 'price_desc'])(
    'sorts the full matching set by effective price before paging: %s',
    async (sort) => {
      const { service, sqlQueries, tx } = fixture([
        product('a', 500, 100),
        product('b', 200),
        product('c', 300),
        product('d', 50),
        product('e', 500, 400),
      ]);
      const result = await service.findAll({ sort, page: 2, limit: 2 });
      expect(result.data.map(({ id }) => id)).toEqual(
        sort === 'price_asc' ? ['b', 'c'] : ['b', 'a'],
      );
      expect(result.meta).toMatchObject({
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      });
      expect(sqlQueries[0].sql).toMatch(
        /ORDER BY COALESCE\(p\.sale_price, p\.price\) (ASC|DESC), p\.id ASC\s+LIMIT \? OFFSET \?/,
      );
      expect(sqlQueries[0].values.slice(-2)).toEqual([2, 2]);
      expect(tx.product.findMany.mock.calls[0][0].where.id).toEqual({
        in: sort === 'price_asc' ? ['b', 'c'] : ['b', 'a'],
      });
    },
  );

  it('preserves category descendants, brand, search, sale, range, and spec filters in the SQL page', async () => {
    const rows = [
      product('match', 500, 100),
      product('wrong-brand', 500, 100),
      product('wrong-category', 500, 100),
      product('not-on-sale', 100),
    ];
    rows[0].categoryId = 'child';
    rows[1].brand.slug = 'makita';
    rows[2].categoryId = 'elsewhere';
    const { service, sqlQueries } = fixture(rows);
    const result = await service.findAll({
      sort: 'price_asc',
      category: 'tools',
      brand: 'bosch',
      search: 'needle',
      onSale: 'true',
      minPrice: 90,
      maxPrice: 110,
      spec: 'Điện áp:18V',
    });
    expect(result.data.map(({ id }) => id)).toEqual(['match']);
    const query = sqlQueries[0];
    expect(query.sql).toContain('p.deleted_at IS NULL AND p.is_active = true');
    expect(query.sql).toContain('p.category_id IN (?,?)');
    expect(query.sql).toContain('b.slug = ?');
    expect(query.sql).toContain('p.sale_price < p.price');
    expect(query.sql).toContain('s.spec_name = ? AND s.spec_value = ?');
    expect(query.values).toEqual(
      expect.arrayContaining([
        'cat',
        'child',
        'bosch',
        90,
        110,
        'match',
        'Điện áp',
        '18V',
      ]),
    );
  });

  it('binds user-provided brand and spec values instead of interpolating them into SQL', async () => {
    const malicious = "x' OR 1=1 --";
    const { service, sqlQueries } = fixture([]);
    await service.findAll({
      sort: 'price_asc',
      brand: malicious,
      spec: `Model:${malicious}`,
    });
    expect(sqlQueries[0].sql).not.toContain(malicious);
    expect(
      sqlQueries[0].values.filter((value) => value === malicious),
    ).toHaveLength(2);
  });

  it('zero-price range is valid and does not fall back to the original price when salePrice is zero', async () => {
    const { service } = fixture([
      product('zero-sale', 100, 0),
      product('zero-regular', 0),
      product('not-zero', 100),
    ]);
    expect(
      (await service.findAll({ minPrice: 0, maxPrice: 0 })).data.map(
        ({ id }) => id,
      ),
    ).toEqual(['zero-sale', 'zero-regular']);
  });
});
