import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

const recipient = {
  bank_transfer_enabled: 'true',
  bank_code: '970436',
  bank_account: 'TESTONLY001',
  bank_name: 'TEST RECIPIENT',
};
const dto: CreateOrderDto = {
  receiverName: 'Test buyer',
  receiverPhone: '0000000000',
  shippingAddress: 'Local test only',
  items: [{ productId: 'product', quantity: 2 }],
};

function fixture(settings: Record<string, string>) {
  const prisma = {
    setting: {
      findMany: jest
        .fn()
        .mockResolvedValue(
          Object.entries(settings).map(([key, value]) => ({ key, value })),
        ),
      findUnique: jest.fn().mockResolvedValue({ value: '2000000' }),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'product',
          name: 'Test product',
          price: 100000,
          salePrice: null,
        },
      ]),
    },
    order: {
      create: jest
        .fn<
          Promise<{ orderCode: string; total: number }>,
          [Prisma.OrderCreateArgs]
        >()
        .mockResolvedValue({ orderCode: 'TEST-ORDER', total: 230000 }),
    },
  };
  return {
    prisma,
    service: new OrdersService(prisma as unknown as PrismaService),
  };
}

describe('bank transfer order creation', () => {
  it.each([
    ['missing recipient', {}],
    ['disabled recipient', { ...recipient, bank_transfer_enabled: 'false' }],
    ['demo recipient', { ...recipient, bank_account: '1234567890' }],
  ])('rejects %s before creating an order', async (_name, settings) => {
    const { prisma, service } = fixture(settings);
    await expect(
      service.create(null, { ...dto, paymentMethod: 'BANK_TRANSFER' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it.each(['COD', undefined] as const)(
    'preserves %s checkout when bank transfer is unavailable',
    async (paymentMethod) => {
      const { prisma, service } = fixture({});
      const order = await service.create(null, { ...dto, paymentMethod });
      expect(prisma.setting.findMany).not.toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledTimes(1);
      expect(prisma.order.create.mock.calls[0][0]).toMatchObject({
        data: {
          subtotal: 200000,
          shippingFee: 30000,
          total: 230000,
          payments: { create: { method: 'COD', amount: 230000 } },
        },
      });
      expect(order.bankTransfer).toBeNull();
    },
  );

  it('returns the server-accepted recipient and preserves the charged amount', async () => {
    const { prisma, service } = fixture(recipient);
    const order = await service.create(null, {
      ...dto,
      paymentMethod: 'BANK_TRANSFER',
    });
    expect(prisma.order.create).toHaveBeenCalledTimes(1);
    expect(prisma.order.create.mock.calls[0][0]).toMatchObject({
      data: {
        total: 230000,
        payments: { create: { method: 'BANK_TRANSFER', amount: 230000 } },
      },
    });
    expect(order.bankTransfer).toEqual({
      bankCode: '970436',
      accountNumber: 'TESTONLY001',
      accountName: 'TEST RECIPIENT',
    });
  });
});
