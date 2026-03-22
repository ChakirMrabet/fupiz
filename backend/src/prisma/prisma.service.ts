import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseProvider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

    // Local development keeps the fast file-based SQLite path, while deployed
    // environments can switch to PostgreSQL or MySQL by changing env only.
    if (databaseProvider === 'sqlite') {
      const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
      super({ adapter });
      return;
    }

    if (databaseProvider === 'postgresql' || databaseProvider === 'mysql') {
      super();
      return;
    }

    throw new Error(`Unsupported DATABASE_PROVIDER: ${databaseProvider}`);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
