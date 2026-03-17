import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Link, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

import { PLAN_FEATURES } from '../plans/plans.config';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) {}

  generateShortCode(): string {
    return randomBytes(4).toString('hex');
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

    const userPlan = (user as any).plan || 'FREE';
    const planLimits = PLAN_FEATURES[userPlan] || PLAN_FEATURES['FREE'];

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

    let shortCode = data.customCode || this.generateShortCode();
    return this.prisma.link.create({
      data: {
        originalUrl: data.originalUrl,
        shortCode,
        password: data.password || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
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

    const userPlan = (link.user as any).plan || 'FREE';
    const planLimits = PLAN_FEATURES[userPlan] || PLAN_FEATURES['FREE'];

    if (data.password !== undefined && data.password !== link.password && !planLimits.canUsePassword) {
       throw new HttpException('Password protection is available on the PRO plan.', HttpStatus.FORBIDDEN);
    }

    if (data.expiresAt !== undefined && data.expiresAt !== link.expiresAt && !planLimits.canUseExpiration) {
       throw new HttpException('Link expiration requires the PRO plan.', HttpStatus.FORBIDDEN);
    }
    
    return this.prisma.link.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : link.isActive,
        password: data.password !== undefined ? data.password : link.password,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : link.expiresAt,
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

  async incrementClicks(id: number) {
    return this.prisma.link.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }
}
