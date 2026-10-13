import type { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import type { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

function fixture(
  products: {
    id: string;
    price: number;
    salePrice: number | null;
    freeShip: boolean;
  }[],
  threshold: string | null = '2000000',
) {
  const prisma = {
    product: {
      findMany: jest
        .fn<Promise<unknown>, [Prisma.ProductFindManyArgs]>()
        .mockResolvedValue(
          products.map((product) => ({ ...product, name: product.id })),
        ),
    },
    setting: {
      findUnique: jest
        .fn()
        .mockResolvedValue(threshold === null ? null : { value: threshold }),
    },
    order: {
      create: jest
        .fn<Promise<{ orderCode: string }>, [Prisma.OrderCreateArgs]>()
        .mockResolvedValue({ orderCode: 'TEST-ONLY' }),
    },
  };
  const service = new OrdersService(prisma as unknown as PrismaService);
  const dto: CreateOrderDto = {
    receiverName: 'Test only',
    receiverPhone: '0000000000',
    shippingAddress: 'Local test',
    items: products.map((product) => ({ productId: product.id, quantity: 1 })),
  };
  return { prisma, service, dto };
}
const product = (
  id: string,
  price: number,
  freeShip = false,
  salePrice: number | null = null,
) => ({ id, price, salePrice, freeShip });

describe('server shipping and order totals', () => {
  it.each([
    [
      'one explicitly free product below threshold',
      [product('a', 100000, true)],
      0,
    ],
    [
      'all explicitly free products below threshold',
      [product('a', 100000, true), product('b', 200000, true)],
      0,
    ],
    [
      'mixed cart below threshold',
      [product('a', 100000, true), product('b', 200000)],
      30000,
    ],
    ['ordinary product below threshold', [product('a', 1999999)], 30000],
    ['exact threshold', [product('a', 2000000)], 0],
    ['above threshold', [product('a', 2000001)], 0],
  ])('charges the stated fee for %s', async (_name, products, shippingFee) => {
    const { prisma, service, dto } = fixture(products);
    await service.create(null, dto);
    const subtotal = products.reduce(
      (sum, item) => sum + (item.salePrice ?? item.price),
      0,
    );
    expect(prisma.order.create.mock.calls[0][0].data).toMatchObject({
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      payments: { create: { method: 'COD', amount: subtotal + shippingFee } },
    });
    const productQuery = prisma.product.findMany.mock.calls[0][0];
    expect(productQuery.select?.freeShip).toBe(true);
  });

  it.each([
    null,
    '',
    ' ',
    '0',
    '-100',
    'not-a-number',
    'Infinity',
    '2000000.5',
  ])(
    'uses the storefront default for invalid threshold %s',
    async (threshold) => {
      const { prisma, service, dto } = fixture(
        [product('a', 2000000)],
        threshold,
      );
      await service.create(null, dto);
      expect(prisma.order.create.mock.calls[0][0].data.shippingFee).toBe(0);
    },
  );

  it('uses a valid configured threshold and the server sale price rather than client amounts or freeShip claims', async () => {
    const { prisma, service, dto } = fixture(
      [product('a', 1000000, false, 400000)],
      '1000000',
    );
    const tampered = {
      ...dto,
      subtotal: 0,
      shippingFee: 0,
      items: [{ productId: 'a', quantity: 2, freeShip: true, price: 0 }],
    };
    await service.create(null, tampered);
    expect(prisma.order.create.mock.calls[0][0].data).toMatchObject({
      subtotal: 800000,
      shippingFee: 30000,
      total: 830000,
      items: {
        create: [
          { productId: 'a', productName: 'a', unitPrice: 400000, quantity: 2 },
        ],
      },
      payments: { create: { amount: 830000 } },
    });
  });
});
