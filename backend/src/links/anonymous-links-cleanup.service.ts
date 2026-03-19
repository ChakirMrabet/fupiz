import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnonymousLinksCleanupService {
  private readonly logger = new Logger(AnonymousLinksCleanupService.name);
  private static readonly RETENTION_DAYS = 30;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredAnonymousLinks() {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - AnonymousLinksCleanupService.RETENTION_DAYS,
    );

    const result = await this.prisma.link.deleteMany({
      where: {
        userId: null,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Deleted ${result.count} anonymous links older than ${AnonymousLinksCleanupService.RETENTION_DAYS} days`,
      );
    }
  }
}
