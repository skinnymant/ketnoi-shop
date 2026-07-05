import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: jest.fn() } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return status ok', async () => {
      expect(await appController.health()).toEqual({
        status: 'ok',
        database: 'connected',
      });
    });
  });
});
