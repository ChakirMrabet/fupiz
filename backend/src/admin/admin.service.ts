import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_IDS, isPlanId } from '../plans/plans.config';

type AdminAuditContext = {
  actorUserId: number;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(params: {
    search?: string;
    role?: string;
    plan?: string;
    isActive?: string;
    subscriptionStatus?: string;
    page?: string;
    pageSize?: string;
  }) {
    const { search, role, plan, isActive, subscriptionStatus, page, pageSize } = params;
    const normalizedSearch = search?.trim();
    const currentPage = this.parsePositiveInt(page, 1);
    const currentPageSize = this.parseBoundedPageSize(pageSize, 10);
    const where: any = {
      ...(normalizedSearch
        ? {
            OR: [
              { email: { contains: normalizedSearch } },
              { name: { contains: normalizedSearch } },
            ],
          }
        : {}),
      ...(role && role !== 'ALL' ? { role } : {}),
      ...(plan && plan !== 'ALL' ? { plan } : {}),
      ...(isActive === 'true' ? { isActive: true } : {}),
      ...(isActive === 'false' ? { isActive: false } : {}),
      ...(subscriptionStatus && subscriptionStatus !== 'ALL'
        ? subscriptionStatus === 'none'
          ? { stripeSubscriptionStatus: null }
          : { stripeSubscriptionStatus: subscriptionStatus }
        : {}),
    };

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          _count: {
            select: { links: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * currentPageSize,
        take: currentPageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => {
        const { password, activationToken, activationTokenExpiresAt, ...result } = user;
        return result;
      }),
      totalItems,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / currentPageSize)),
    };
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

  async updateUser(userId: number, data: any, auditContext: AdminAuditContext) {
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

    await this.logAdminAudit({
      ...auditContext,
      action: 'user.updated',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
      changes: this.buildUserAuditChanges(existingUser, user),
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

  async listLinks(params: {
    search?: string;
    ownerType?: string;
    isActive?: string;
    plan?: string;
    subscriptionStatus?: string;
    page?: string;
    pageSize?: string;
  }) {
    const { search, ownerType, isActive, plan, subscriptionStatus, page, pageSize } = params;
    const normalizedSearch = search?.trim();
    const currentPage = this.parsePositiveInt(page, 1);
    const currentPageSize = this.parseBoundedPageSize(pageSize, 10);
    const userFilters: Record<string, unknown> = {
      ...(plan && plan !== 'ALL' ? { plan } : {}),
      ...(subscriptionStatus && subscriptionStatus !== 'ALL'
        ? subscriptionStatus === 'none'
          ? { stripeSubscriptionStatus: null }
          : { stripeSubscriptionStatus: subscriptionStatus }
        : {}),
    };
    const where: any = {
      ...(normalizedSearch
        ? {
            OR: [
              { shortCode: { contains: normalizedSearch } },
              { originalUrl: { contains: normalizedSearch } },
              { user: { email: { contains: normalizedSearch } } },
              { user: { name: { contains: normalizedSearch } } },
            ],
          }
        : {}),
      ...(ownerType === 'ACCOUNT' ? { userId: { not: null } } : {}),
      ...(ownerType === 'ANONYMOUS' ? { userId: null } : {}),
      ...(isActive === 'true' ? { isActive: true } : {}),
      ...(isActive === 'false' ? { isActive: false } : {}),
      ...(Object.keys(userFilters).length > 0 ? { user: userFilters } : {}),
    };

    const [links, totalItems] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
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
        skip: (currentPage - 1) * currentPageSize,
        take: currentPageSize,
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      items: links,
      totalItems,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / currentPageSize)),
    };
  }

  async listAuditLogs(params: {
    search?: string;
    action?: string;
    targetType?: string;
    page?: string;
    pageSize?: string;
  }) {
    const { search, action, targetType, page, pageSize } = params;
    const normalizedSearch = search?.trim();
    const currentPage = this.parsePositiveInt(page, 1);
    const currentPageSize = this.parseBoundedPageSize(pageSize, 20);
    const where: any = {
      ...(normalizedSearch
        ? {
            OR: [
              { targetLabel: { contains: normalizedSearch } },
              { action: { contains: normalizedSearch } },
              { actorUser: { email: { contains: normalizedSearch } } },
              { actorUser: { name: { contains: normalizedSearch } } },
            ],
          }
        : {}),
      ...(action && action !== 'ALL' ? { action } : {}),
      ...(targetType && targetType !== 'ALL' ? { targetType } : {}),
    };

    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * currentPageSize,
        take: currentPageSize,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      items: logs,
      totalItems,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / currentPageSize)),
    };
  }

  async updateLink(linkId: number, data: any, auditContext: AdminAuditContext) {
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

    const updatedLink = await this.prisma.link.update({
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

    await this.logAdminAudit({
      ...auditContext,
      action: 'link.updated',
      targetType: 'link',
      targetId: updatedLink.id,
      targetLabel: updatedLink.shortCode,
      changes: this.buildLinkAuditChanges(link, updatedLink),
    });

    return updatedLink;
  }

  async removeLink(linkId: number, auditContext: AdminAuditContext) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    const deletedLink = await this.prisma.link.delete({
      where: { id: linkId },
    });

    await this.logAdminAudit({
      ...auditContext,
      action: 'link.deleted',
      targetType: 'link',
      targetId: link.id,
      targetLabel: link.shortCode,
      changes: JSON.stringify({
        deleted: {
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          ownerEmail: link.user?.email ?? null,
          isActive: link.isActive,
          maxClicks: link.maxClicks,
          singleUse: link.singleUse,
          expiresAt: this.serializeValue(link.expiresAt),
          passwordProtected: Boolean(link.password),
          hasLandingPage: this.hasLandingPage(link),
        },
      }),
    });

    return deletedLink;
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

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
  }

  private parseBoundedPageSize(value: string | undefined, fallback: number) {
    const parsedValue = this.parsePositiveInt(value, fallback);
    return Math.min(parsedValue, 100);
  }

  private async logAdminAudit(entry: {
    actorUserId: number;
    action: string;
    targetType: string;
    targetId: number;
    targetLabel?: string;
    changes?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.adminAuditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel,
        changes: entry.changes,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  private buildUserAuditChanges(before: any, after: any) {
    return this.stringifyChanges(
      this.pickChangedFields(
        {
          name: before.name,
          role: before.role,
          plan: before.plan,
          isActive: before.isActive,
        },
        {
          name: after.name,
          role: after.role,
          plan: after.plan,
          isActive: after.isActive,
        },
      ),
    );
  }

  private buildLinkAuditChanges(before: any, after: any) {
    return this.stringifyChanges(
      this.pickChangedFields(
        {
          originalUrl: before.originalUrl,
          shortCode: before.shortCode,
          expiresAt: before.expiresAt,
          maxClicks: before.maxClicks,
          singleUse: before.singleUse,
          landingTitle: before.landingTitle,
          landingDescription: before.landingDescription,
          landingButtonLabel: before.landingButtonLabel,
          isActive: before.isActive,
          passwordProtected: Boolean(before.password),
        },
        {
          originalUrl: after.originalUrl,
          shortCode: after.shortCode,
          expiresAt: after.expiresAt,
          maxClicks: after.maxClicks,
          singleUse: after.singleUse,
          landingTitle: after.landingTitle,
          landingDescription: after.landingDescription,
          landingButtonLabel: after.landingButtonLabel,
          isActive: after.isActive,
          passwordProtected: Boolean(after.password),
        },
      ),
    );
  }

  private pickChangedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    for (const key of Object.keys(after)) {
      const previousValue = this.serializeValue(before[key]);
      const nextValue = this.serializeValue(after[key]);

      if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
        changes[key] = {
          before: previousValue,
          after: nextValue,
        };
      }
    }

    return changes;
  }

  private stringifyChanges(changes: Record<string, unknown>) {
    return Object.keys(changes).length > 0 ? JSON.stringify(changes) : null;
  }

  private serializeValue(value: unknown) {
    return value instanceof Date ? value.toISOString() : value;
  }

  private hasLandingPage(link: {
    landingTitle?: string | null;
    landingDescription?: string | null;
    landingButtonLabel?: string | null;
  }) {
    return Boolean(link.landingTitle || link.landingDescription || link.landingButtonLabel);
  }
}
