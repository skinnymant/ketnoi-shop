import { AppController } from './app.controller';
import type { PrismaService } from './prisma/prisma.service';

jest.mock('./prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('healthy backend capability contract', () => {
  it('advertises effective price filtering and product shipping only after the DB responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) };
    const controller = new AppController(prisma as unknown as PrismaService);
    await expect(controller.health()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
      capabilities: {
        effectivePriceFilters: true,
        productFreeShipping: true,
      },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('does not produce a healthy/capable response when the database probe fails', async () => {
    const databaseError = new Error('Database unavailable');
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(databaseError) };
    const controller = new AppController(prisma as unknown as PrismaService);
    await expect(controller.health()).rejects.toBe(databaseError);
  });
});
