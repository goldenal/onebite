import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'beforeExit'> implements OnModuleInit {
  constructor() {
    super();
    this.$use(async (params, next) => {
      const isReadAction =
        params.action.startsWith('find') ||
        params.action === 'aggregate' ||
        params.action === 'count' ||
        params.action === 'groupBy';

      try {
        return await next(params);
      } catch (err: any) {
        const code = err?.code;
        const message = String(err?.message || '');
        const isPoolTimeout = code === 'P2024' || message.includes('Timed out fetching a new connection from the connection pool');
        const isDbUnavailable = code === 'P1001';

        if (isReadAction && (isPoolTimeout || isDbUnavailable)) {
          await new Promise((r) => setTimeout(r, 200));
          return next(params);
        }
        throw err;
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
