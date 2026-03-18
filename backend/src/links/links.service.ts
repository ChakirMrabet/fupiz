import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Link, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { UAParser } from 'ua-parser-js';

import { getPlanConfig } from '../plans/plans.config';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) {}

  generateShortCode(): string {
    return randomBytes(4).toString('hex');
  }

  private parseMaxClicks(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException('Max clicks must be a positive whole number');
    }

    return parsedValue;
  }

  async create(userId: number, data: any): Promise<Link> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planLimits = getPlanConfig((user as any).plan);

    if (user._count.links >= planLimits.maxLinks) {
      throw new HttpException('Link limit reached for your current plan.', HttpStatus.PAYMENT_REQUIRED);
    }

    if (data.customCode && !planLimits.canUseCustomCode) {
      throw new HttpException('Custom codes exist only on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.password && !planLimits.canUsePassword) {
      throw new HttpException('Password protection is available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.expiresAt && !planLimits.canUseExpiration) {
      throw new HttpException('Link expiration requires the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.maxClicks !== undefined && data.maxClicks !== null && !planLimits.canUseClickLimit) {
      throw new HttpException('Click limits are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    const maxClicks = this.parseMaxClicks(data.maxClicks);

    let shortCode = data.customCode || this.generateShortCode();
    return this.prisma.link.create({
      data: {
        originalUrl: data.originalUrl,
        shortCode,
        password: data.password || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxClicks: maxClicks ?? null,
        userId,
      },
    });
  }

  async findAll(userId: number): Promise<Link[]> {
    return this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByShortCode(shortCode: string): Promise<Link | null> {
    return this.prisma.link.findUnique({
      where: { shortCode },
    });
  }

  async update(id: number, userId: number, data: any): Promise<Link> {
    const link = await this.prisma.link.findFirst({ where: { id, userId }, include: { user: true } });
    if (!link) throw new NotFoundException('Link not found or unauthorized');

    const planLimits = getPlanConfig((link.user as any).plan);
    const nextOriginalUrl =
      typeof data.originalUrl === 'string' ? data.originalUrl.trim() : undefined;
    const requestedShortCodeRaw =
      typeof data.shortCode === 'string'
        ? data.shortCode.trim()
        : typeof data.customCode === 'string'
          ? data.customCode.trim()
          : undefined;

    if (data.password !== undefined && data.password !== link.password && !planLimits.canUsePassword) {
       throw new HttpException('Password protection is available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.expiresAt !== undefined && data.expiresAt !== link.expiresAt && !planLimits.canUseExpiration) {
       throw new HttpException('Link expiration requires the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.maxClicks !== undefined && data.maxClicks !== link.maxClicks && !planLimits.canUseClickLimit) {
      throw new HttpException('Click limits are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    const maxClicks = this.parseMaxClicks(data.maxClicks);

    if (nextOriginalUrl !== undefined && !nextOriginalUrl) {
      throw new BadRequestException('Original URL cannot be empty');
    }

    if (requestedShortCodeRaw !== undefined && requestedShortCodeRaw !== link.shortCode) {
      if (!requestedShortCodeRaw) {
        throw new BadRequestException('Short code cannot be empty');
      }

      if (!planLimits.canUseCustomCode) {
        throw new HttpException('Custom codes exist only on paid plans.', HttpStatus.FORBIDDEN);
      }

      const existingShortCode = await this.prisma.link.findUnique({
        where: { shortCode: requestedShortCodeRaw },
      });

      if (existingShortCode && existingShortCode.id !== link.id) {
        throw new ConflictException('This short code is already in use');
      }
    }
    
    return this.prisma.link.update({
      where: { id },
      data: {
        originalUrl: nextOriginalUrl !== undefined ? nextOriginalUrl : link.originalUrl,
        shortCode:
          requestedShortCodeRaw !== undefined ? requestedShortCodeRaw : link.shortCode,
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        password: data.password !== undefined ? data.password : link.password,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : link.expiresAt,
        maxClicks: maxClicks !== undefined ? maxClicks : link.maxClicks,
      },
    });
  }

  async remove(id: number, userId: number): Promise<Link> {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found or unauthorized');

    return this.prisma.link.delete({
      where: { id },
    });
  }

  async recordClick(linkId: number, metadata: { ip: string; userAgent: string; referer: string }) {
    const parser = new UAParser(metadata.userAgent);
    const result = parser.getResult();

    return this.prisma.$transaction(async (tx) => {
      const link = await tx.link.findUnique({
        where: { id: linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (link.maxClicks !== null && link.clicks >= link.maxClicks) {
        if (link.isActive) {
          await tx.link.update({
            where: { id: linkId },
            data: { isActive: false },
          });
        }
        throw new NotFoundException('Link has expired.');
      }

      const updatedLink = await tx.link.update({
        where: { id: linkId },
        data: {
          clicks: { increment: 1 },
        },
      });

      await tx.linkClick.create({
        data: {
          linkId,
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
          browser: result.browser.name || 'Unknown',
          os: result.os.name || 'Unknown',
          referer: metadata.referer || 'Direct',
        },
      });

      if (updatedLink.maxClicks !== null && updatedLink.clicks >= updatedLink.maxClicks) {
        await tx.link.update({
          where: { id: linkId },
          data: { isActive: false },
        });
      }

      return updatedLink;
    });
  }

  async getAnalytics(id: number, userId: number) {
    const link = await (this.prisma as any).link.findFirst({
      where: { id, userId },
      include: {
        clickEvents: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!link) throw new NotFoundException('Link not found');

    // Aggregate data
    const totalClicks = link.clicks;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [browsers, os, referers, timeline] = await Promise.all([
      (this.prisma as any).linkClick.groupBy({
        by: ['browser'],
        where: { linkId: id },
        _count: { _all: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 5,
      }),
      this.prisma.linkClick.groupBy({
        by: ['os'],
        where: { linkId: id },
        _count: { _all: true },
        orderBy: { _count: { os: 'desc' } },
        take: 5,
      }),
      this.prisma.linkClick.groupBy({
        by: ['referer'],
        where: { linkId: id },
        _count: { _all: true },
        orderBy: { _count: { referer: 'desc' } },
        take: 5,
      }),
      (this.prisma as any).$queryRaw<any[]>`
        SELECT date(createdAt) as date, count(*) as count
        FROM LinkClick
        WHERE linkId = ${id} AND createdAt > ${sevenDaysAgo}
        GROUP BY date(createdAt)
        ORDER BY date ASC
      `,
    ]);

    // Ensure all counts are Numbers (not BigInts) for JSON serialization
    const formattedTimeline = (timeline || []).map((entry: any) => ({
      date: entry.date,
      count: Number(entry.count || 0)
    }));

    return {
      link,
      stats: {
        totalClicks: Number(totalClicks),
        browsers: browsers.map((b: any) => ({ name: b.browser, count: Number(b._count._all) })),
        os: os.map((o: any) => ({ name: o.os, count: Number(o._count._all) })),
        referers: referers.map((r: any) => ({ name: r.referer, count: Number(r._count._all) })),
        timeline: formattedTimeline,
        recentClicks: link.clickEvents,
      }
    };
  }
}
