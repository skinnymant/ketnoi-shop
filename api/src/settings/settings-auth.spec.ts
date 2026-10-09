import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { SettingsModule } from './settings.module';
import { SettingsService } from './settings.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('settings HTTP authorization', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const service = {
    findAllAsMap: jest
      .fn()
      .mockResolvedValue({ bank_transfer_enabled: 'false' }),
    findOne: jest
      .fn()
      .mockResolvedValue({ key: 'bank_transfer_enabled', value: 'false' }),
    upsert: jest
      .fn()
      .mockResolvedValue({ key: 'bank_transfer_enabled', value: 'true' }),
    remove: jest.fn().mockResolvedValue({ key: 'bank_transfer_enabled' }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({ global: true, secret: 'local-settings-test-key' }),
        SettingsModule,
      ],
    })
      .overrideProvider(SettingsService)
      .useValue(service)
      .compile();
    app = module.createNestApplication();
    await app.init();
    jwt = module.get(JwtService);
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('keeps both read endpoints public', async () => {
    await request(app.getHttpServer())
      .get('/settings')
      .expect(200)
      .expect({ bank_transfer_enabled: 'false' });
    await request(app.getHttpServer())
      .get('/settings/bank_transfer_enabled')
      .expect(200);
  });

  it.each(['missing', 'customer', 'malformed', 'forged', 'expired'] as const)(
    'blocks PUT and DELETE with %s authorization',
    async (kind) => {
      const tokens = {
        missing: undefined,
        customer: jwt.sign({ sub: 'customer', typ: 'customer' }),
        malformed: 'not-a-jwt',
        forged: jwt.sign(
          { sub: 'admin', typ: 'admin' },
          { secret: 'wrong-signature' },
        ),
        expired: jwt.sign({ sub: 'admin', typ: 'admin' }, { expiresIn: -1 }),
      };
      for (const method of ['put', 'delete'] as const) {
        const call = request(app.getHttpServer())[method](
          '/settings/bank_transfer_enabled',
        );
        if (tokens[kind]) call.set('Authorization', `Bearer ${tokens[kind]}`);
        if (method === 'put') call.send({ value: 'true' });
        await call.expect(401);
      }
      expect(service.upsert).not.toHaveBeenCalled();
      expect(service.remove).not.toHaveBeenCalled();
    },
  );

  it('allows a valid admin JWT to update and delete through the real guard', async () => {
    const token = jwt.sign({
      sub: 'admin',
      name: 'Test administrator',
      typ: 'admin',
    });
    await request(app.getHttpServer())
      .put('/settings/bank_transfer_enabled')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'true' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/settings/bank_transfer_enabled')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(service.upsert).toHaveBeenCalledWith(
      'bank_transfer_enabled',
      'true',
    );
    expect(service.remove).toHaveBeenCalledWith('bank_transfer_enabled');
  });
});
