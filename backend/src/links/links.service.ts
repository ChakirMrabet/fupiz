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
import * as bcrypt from 'bcrypt';

import { getPlanConfig } from '../plans/plans.config';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  generateShortCode(): string {
    return randomBytes(4).toString('hex');
  }

  private getNormalizedOriginalUrl(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('Original URL is required');
    }

    return value.trim();
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

  private async getStoredLinkPassword(value: unknown) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    // Link passwords are treated like account passwords: only a bcrypt hash is stored,
    // and client-facing responses expose a boolean capability instead of the secret.
    return bcrypt.hash(String(value), 10);
  }

  private sanitizeLinkForClient<T extends { password?: string | null }>(link: T) {
    const { password, ...rest } = link;

    return {
      ...rest,
      passwordProtected: Boolean(password),
    };
  }

  getEffectiveMaxClicks(link: { maxClicks: number | null; singleUse: boolean }): number | null {
    return link.singleUse ? 1 : link.maxClicks;
  }

  hasReachedClickLimit(link: { clicks: number; maxClicks: number | null; singleUse: boolean }) {
    const effectiveMaxClicks = this.getEffectiveMaxClicks(link);
    return effectiveMaxClicks !== null && link.clicks >= effectiveMaxClicks;
  }

  hasLandingPage(link: {
    landingTitle: string | null;
    landingDescription: string | null;
    landingButtonLabel: string | null;
  }) {
    return Boolean(link.landingTitle || link.landingDescription || link.landingButtonLabel);
  }

  async createAnonymous(data: any): Promise<Link> {
    const hasAdvancedOptions =
      Boolean(data.customCode || data.password || data.expiresAt || data.singleUse) ||
      data.maxClicks !== undefined ||
      Boolean(data.landingTitle || data.landingDescription || data.landingButtonLabel);

    if (hasAdvancedOptions) {
      throw new BadRequestException(
        'Anonymous link creation only supports a destination URL',
      );
    }

    return this.prisma.link.create({
      data: {
        originalUrl: this.getNormalizedOriginalUrl(data.originalUrl),
        shortCode: this.generateShortCode(),
        userId: null,
      },
    });
  }

  async create(userId: number, data: any) {
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

    if (data.singleUse && !planLimits.canUseSingleUseLinks) {
      throw new HttpException('One-time links are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (
      (data.landingTitle || data.landingDescription || data.landingButtonLabel) &&
      !planLimits.canUseCustomLanding
    ) {
      throw new HttpException('Custom landing pages are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    const maxClicks = this.parseMaxClicks(data.maxClicks);
    const singleUse = Boolean(data.singleUse);
    const storedPassword = await this.getStoredLinkPassword(data.password);

    let shortCode = data.customCode || this.generateShortCode();
    const link = await this.prisma.link.create({
      data: {
        originalUrl: this.getNormalizedOriginalUrl(data.originalUrl),
        shortCode,
        password: storedPassword ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxClicks: singleUse ? null : maxClicks ?? null,
        singleUse,
        landingTitle: data.landingTitle?.trim() || null,
        landingDescription: data.landingDescription?.trim() || null,
        landingButtonLabel: data.landingButtonLabel?.trim() || null,
        userId,
      },
    });

    void this.webhooksService.dispatchEvent(userId, 'link.created', {
      linkId: link.id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
    });

    return this.sanitizeLinkForClient(link);
  }

  async bulkCreate(userId: number, entries: any[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planLimits = getPlanConfig((user as any).plan);
    if (!planLimits.canUseBulkCreation) {
      throw new HttpException('Bulk link creation is available on the Business plan.', HttpStatus.FORBIDDEN);
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      throw new BadRequestException('At least one bulk entry is required');
    }

    const results = await Promise.all(
      entries.map(async (entry, index) => {
        try {
          const link = await this.create(userId, entry);
          return {
            index,
            success: true,
            link,
          };
        } catch (error: any) {
          return {
            index,
            success: false,
            error: error?.message || 'Failed to create link',
          };
        }
      }),
    );

    const createdCount = results.filter((result) => result.success).length;

    return {
      createdCount,
      failedCount: results.length - createdCount,
      results,
    };
  }

  async findAll(userId: number) {
    const links = await this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) => this.sanitizeLinkForClient(link));
  }

  async findByShortCode(shortCode: string): Promise<Link | null> {
    return this.prisma.link.findUnique({
      where: { shortCode },
    });
  }

  async deactivate(id: number): Promise<Link> {
    return this.prisma.link.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async update(id: number, userId: number, data: any) {
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

    if (data.password !== undefined && !planLimits.canUsePassword) {
       throw new HttpException('Password protection is available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.expiresAt !== undefined && data.expiresAt !== link.expiresAt && !planLimits.canUseExpiration) {
       throw new HttpException('Link expiration requires the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.maxClicks !== undefined && data.maxClicks !== link.maxClicks && !planLimits.canUseClickLimit) {
      throw new HttpException('Click limits are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.singleUse !== undefined && data.singleUse !== link.singleUse && !planLimits.canUseSingleUseLinks) {
      throw new HttpException('One-time links are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    const landingPageChanged =
      data.landingTitle !== undefined ||
      data.landingDescription !== undefined ||
      data.landingButtonLabel !== undefined;

    if (landingPageChanged && !planLimits.canUseCustomLanding) {
      throw new HttpException('Custom landing pages are available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    const maxClicks = this.parseMaxClicks(data.maxClicks);
    const nextSingleUse = data.singleUse !== undefined ? Boolean(data.singleUse) : link.singleUse;

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
    
    const storedPassword = await this.getStoredLinkPassword(data.password);

    const updatedLink = await this.prisma.link.update({
      where: { id },
      data: {
        originalUrl: nextOriginalUrl !== undefined ? nextOriginalUrl : link.originalUrl,
        shortCode:
          requestedShortCodeRaw !== undefined ? requestedShortCodeRaw : link.shortCode,
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        password: storedPassword !== undefined ? storedPassword : link.password,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : link.expiresAt,
        maxClicks: nextSingleUse
          ? null
          : maxClicks !== undefined
            ? maxClicks
            : link.maxClicks,
        singleUse: nextSingleUse,
        landingTitle:
          data.landingTitle !== undefined ? data.landingTitle?.trim() || null : link.landingTitle,
        landingDescription:
          data.landingDescription !== undefined
            ? data.landingDescription?.trim() || null
            : link.landingDescription,
        landingButtonLabel:
          data.landingButtonLabel !== undefined
            ? data.landingButtonLabel?.trim() || null
            : link.landingButtonLabel,
      },
    });

    void this.webhooksService.dispatchEvent(userId, 'link.updated', {
      linkId: updatedLink.id,
      shortCode: updatedLink.shortCode,
      originalUrl: updatedLink.originalUrl,
      isActive: updatedLink.isActive,
    });

    return this.sanitizeLinkForClient(updatedLink);
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

    const updatedLink = await this.prisma.$transaction(async (tx) => {
      const link = await tx.link.findUnique({
        where: { id: linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (this.hasReachedClickLimit(link)) {
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

      if (this.hasReachedClickLimit(updatedLink)) {
        await tx.link.update({
          where: { id: linkId },
          data: { isActive: false },
        });
      }

      return updatedLink;
    });

    if (updatedLink.userId) {
      void this.webhooksService.dispatchEvent(updatedLink.userId, 'link.clicked', {
        linkId: updatedLink.id,
        shortCode: updatedLink.shortCode,
        originalUrl: updatedLink.originalUrl,
        clicks: updatedLink.clicks,
      });
    }

    return updatedLink;
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
