import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductDto } from './dto/update-product.dto';
import { parseWarrantyMonths, withWarrantySpec } from './product-warranty';
import { ProductsService } from './products.service';
import type { PrismaService } from '../prisma/prisma.service';

// These unit tests use a transaction double; never construct a database client.
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('product warranty', () => {
  it.each([
    ['6 Tháng', 6],
    ['12 Tháng Chính Hãng', 12],
    ['10 năm', 120],
    ['0 tháng', 0],
    ['Không bảo hành', 0],
    [undefined, null],
    ['', null],
    ['Theo chính sách hãng', null],
    ['6-12 tháng', null],
    ['12 ngày', null],
  ])('reads only an explicit warranty duration: %s', (text, expected) => {
    expect(parseWarrantyMonths(text)).toBe(expected);
  });

  it('uses the structured value instead of a contradictory free-form spec', () => {
    expect(
      withWarrantySpec(
        [
          { specName: 'Điện áp', specValue: '18V' },
          { specName: ' BẢO HÀNH ', specValue: '12 tháng' },
          { specName: 'Bảo hành', specValue: '24 tháng' },
        ],
        6,
      ),
    ).toEqual([
      { specName: 'Điện áp', specValue: '18V' },
      { specName: 'Bảo hành', specValue: '6 tháng', position: 1 },
    ]);
  });

  it.each([0, null, 6, 24])(
    'preserves %s through DTO validation and an update',
    async (months) => {
      const dto = plainToInstance(UpdateProductDto, { warrantyMonths: months });
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.warrantyMonths).toBe(months);

      const tx = {
        product: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            warrantyMonths: 12,
            specs: [{ specName: 'Bảo hành', specValue: '12 tháng' }],
          }),
          update: jest
            .fn()
            .mockResolvedValue({ id: 'product', warrantyMonths: months }),
        },
        productSpec: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      const prisma = {
        product: { findFirst: jest.fn().mockResolvedValue({ id: 'product' }) },
        $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
          callback(tx),
        ),
      };
      const service = new ProductsService(prisma as unknown as PrismaService);
      await service.update('product', dto);

      expect(tx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { warrantyMonths: months },
        }),
      );
      expect(tx.productSpec.deleteMany).toHaveBeenCalled();
      if (months === null) {
        expect(tx.productSpec.createMany).not.toHaveBeenCalled();
      } else {
        expect(tx.productSpec.createMany).toHaveBeenCalledWith({
          data: [
            {
              productId: 'product',
              specName: 'Bảo hành',
              specValue: months === 0 ? 'Không bảo hành' : `${months} tháng`,
              position: 0,
            },
          ],
        });
      }
    },
  );

  it('keeps the existing duration when only specifications are updated', async () => {
    const tx = {
      product: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ warrantyMonths: 24, specs: [] }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'product', warrantyMonths: 24 }),
      },
      productSpec: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue({ id: 'product' }) },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new ProductsService(prisma as unknown as PrismaService);
    await service.update('product', {
      specs: [
        { specName: 'Điện áp', specValue: '18V' },
        { specName: 'Bảo hành', specValue: '12 tháng' },
      ],
    });

    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: {} }),
    );
    expect(tx.productSpec.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product',
          specName: 'Điện áp',
          specValue: '18V',
          position: 0,
        },
        {
          productId: 'product',
          specName: 'Bảo hành',
          specValue: '24 tháng',
          position: 1,
        },
      ],
    });
  });

  it('does not invent a duration for a new product without a confirmed warranty', async () => {
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'product', warrantyMonths: null }),
      },
      category: { findFirst: jest.fn().mockResolvedValue({ id: 'category' }) },
    };
    const service = new ProductsService(prisma as unknown as PrismaService);
    await service.create({
      name: 'Test product',
      slug: 'test-product',
      sku: 'TEST',
      price: 100,
      categoryId: 'category',
      specs: [{ specName: 'Bảo hành', specValue: 'Theo chính sách hãng' }],
    });
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: 'Test product',
        slug: 'test-product',
        sku: 'TEST',
        price: 100,
        categoryId: 'category',
        warrantyMonths: null,
      },
      include: { images: true, specs: true },
    });
  });
});
