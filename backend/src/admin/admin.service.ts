import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_IDS, isPlanId } from '../plans/plans.config';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(search?: string) {
    const normalizedSearch = search?.trim();

    const users = await this.prisma.user.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { email: { contains: normalizedSearch } },
              { name: { contains: normalizedSearch } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: { links: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => {
      const { password, activationToken, activationTokenExpiresAt, ...result } = user;
      return result;
    });
  }

  async getUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { links: true, webhooks: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, activationToken, activationTokenExpiresAt, ...result } = user;
    return result;
  }

  async updateUser(userId: number, data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = typeof data.name === 'string' ? data.name.trim() : null;
    }

    if (data.plan !== undefined) {
      if (!isPlanId(data.plan)) {
        throw new BadRequestException(`Plan must be one of: ${PLAN_IDS.join(', ')}`);
      }
      updateData.plan = data.plan;
    }

    if (data.role !== undefined) {
      if (!['USER', 'ADMIN'].includes(data.role)) {
        throw new BadRequestException('Role must be USER or ADMIN');
      }
      updateData.role = data.role;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, activationToken, activationTokenExpiresAt, ...result } = user;
    return result;
  }

  async getUserLinks(userId: number) {
    await this.ensureUserExists(userId);

    return this.prisma.link.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            stripeSubscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listLinks(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.link.findMany({
      where: normalizedSearch
        ? {
            OR: [
              { shortCode: { contains: normalizedSearch } },
              { originalUrl: { contains: normalizedSearch } },
              { user: { email: { contains: normalizedSearch } } },
              { user: { name: { contains: normalizedSearch } } },
            ],
          }
        : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            stripeSubscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLink(linkId: number, data: any) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    const nextShortCode =
      typeof data.shortCode === 'string' ? data.shortCode.trim() : undefined;

    if (nextShortCode !== undefined && !nextShortCode) {
      throw new BadRequestException('Short code cannot be empty');
    }

    if (nextShortCode && nextShortCode !== link.shortCode) {
      const existingShortCode = await this.prisma.link.findUnique({
        where: { shortCode: nextShortCode },
      });

      if (existingShortCode && existingShortCode.id !== link.id) {
        throw new BadRequestException('This short code is already in use');
      }
    }

    const expiresAt =
      data.expiresAt !== undefined
        ? data.expiresAt
          ? new Date(data.expiresAt)
          : null
        : undefined;

    const maxClicks =
      data.maxClicks !== undefined
        ? data.maxClicks === null || data.maxClicks === ''
          ? null
          : Number(data.maxClicks)
        : undefined;

    if (maxClicks !== undefined && maxClicks !== null && (!Number.isInteger(maxClicks) || maxClicks <= 0)) {
      throw new BadRequestException('Max clicks must be a positive whole number');
    }

    return this.prisma.link.update({
      where: { id: linkId },
      data: {
        originalUrl:
          data.originalUrl !== undefined ? String(data.originalUrl).trim() : undefined,
        shortCode: nextShortCode,
        password: data.password !== undefined ? data.password || null : undefined,
        expiresAt,
        maxClicks,
        singleUse: data.singleUse !== undefined ? Boolean(data.singleUse) : undefined,
        landingTitle:
          data.landingTitle !== undefined ? data.landingTitle?.trim() || null : undefined,
        landingDescription:
          data.landingDescription !== undefined
            ? data.landingDescription?.trim() || null
            : undefined,
        landingButtonLabel:
          data.landingButtonLabel !== undefined
            ? data.landingButtonLabel?.trim() || null
            : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  }

  async removeLink(linkId: number) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    return this.prisma.link.delete({
      where: { id: linkId },
    });
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
