import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const ping = jest.fn<Promise<void>, []>();

  const createService = async (): Promise<HealthService> => {
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule.forRoot({ logger: false })],
      providers: [HealthService, { provide: PrismaService, useValue: { ping } }],
    }).compile();
    return moduleRef.get(HealthService);
  };

  beforeEach(() => ping.mockReset());

  it('reports ok when the database responds', async () => {
    ping.mockResolvedValue(undefined);

    await expect((await createService()).check()).resolves.toMatchObject({
      status: 'ok',
      service: 'wardsetu-backend',
      database: 'up',
    });
  });

  it('reports error without leaking details when the database is down', async () => {
    ping.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432 password=secret'));

    const report = await (await createService()).check();

    expect(report).toMatchObject({ status: 'error', database: 'down' });
    expect(JSON.stringify(report)).not.toMatch(/ECONNREFUSED|secret|5432/);
  });
});
