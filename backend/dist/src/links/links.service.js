"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const ua_parser_js_1 = require("ua-parser-js");
const plans_config_1 = require("../plans/plans.config");
const webhooks_service_1 = require("../webhooks/webhooks.service");
let LinksService = class LinksService {
    prisma;
    webhooksService;
    constructor(prisma, webhooksService) {
        this.prisma = prisma;
        this.webhooksService = webhooksService;
    }
    generateShortCode() {
        return (0, crypto_1.randomBytes)(4).toString('hex');
    }
    parseMaxClicks(value) {
        if (value === undefined)
            return undefined;
        if (value === null || value === '')
            return null;
        const parsedValue = Number(value);
        if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
            throw new common_1.BadRequestException('Max clicks must be a positive whole number');
        }
        return parsedValue;
    }
    getEffectiveMaxClicks(link) {
        return link.singleUse ? 1 : link.maxClicks;
    }
    hasReachedClickLimit(link) {
        const effectiveMaxClicks = this.getEffectiveMaxClicks(link);
        return effectiveMaxClicks !== null && link.clicks >= effectiveMaxClicks;
    }
    hasLandingPage(link) {
        return Boolean(link.landingTitle || link.landingDescription || link.landingButtonLabel);
    }
    async create(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { links: true }
                }
            }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const planLimits = (0, plans_config_1.getPlanConfig)(user.plan);
        if (user._count.links >= planLimits.maxLinks) {
            throw new common_1.HttpException('Link limit reached for your current plan.', common_1.HttpStatus.PAYMENT_REQUIRED);
        }
        if (data.customCode && !planLimits.canUseCustomCode) {
            throw new common_1.HttpException('Custom codes exist only on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.password && !planLimits.canUsePassword) {
            throw new common_1.HttpException('Password protection is available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.expiresAt && !planLimits.canUseExpiration) {
            throw new common_1.HttpException('Link expiration requires the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.maxClicks !== undefined && data.maxClicks !== null && !planLimits.canUseClickLimit) {
            throw new common_1.HttpException('Click limits are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.singleUse && !planLimits.canUseSingleUseLinks) {
            throw new common_1.HttpException('One-time links are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if ((data.landingTitle || data.landingDescription || data.landingButtonLabel) &&
            !planLimits.canUseCustomLanding) {
            throw new common_1.HttpException('Custom landing pages are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        const maxClicks = this.parseMaxClicks(data.maxClicks);
        const singleUse = Boolean(data.singleUse);
        let shortCode = data.customCode || this.generateShortCode();
        const link = await this.prisma.link.create({
            data: {
                originalUrl: data.originalUrl,
                shortCode,
                password: data.password || null,
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
        return link;
    }
    async bulkCreate(userId, entries) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const planLimits = (0, plans_config_1.getPlanConfig)(user.plan);
        if (!planLimits.canUseBulkCreation) {
            throw new common_1.HttpException('Bulk link creation is available on the Business plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            throw new common_1.BadRequestException('At least one bulk entry is required');
        }
        const results = await Promise.all(entries.map(async (entry, index) => {
            try {
                const link = await this.create(userId, entry);
                return {
                    index,
                    success: true,
                    link,
                };
            }
            catch (error) {
                return {
                    index,
                    success: false,
                    error: error?.message || 'Failed to create link',
                };
            }
        }));
        const createdCount = results.filter((result) => result.success).length;
        return {
            createdCount,
            failedCount: results.length - createdCount,
            results,
        };
    }
    async findAll(userId) {
        return this.prisma.link.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByShortCode(shortCode) {
        return this.prisma.link.findUnique({
            where: { shortCode },
        });
    }
    async update(id, userId, data) {
        const link = await this.prisma.link.findFirst({ where: { id, userId }, include: { user: true } });
        if (!link)
            throw new common_1.NotFoundException('Link not found or unauthorized');
        const planLimits = (0, plans_config_1.getPlanConfig)(link.user.plan);
        const nextOriginalUrl = typeof data.originalUrl === 'string' ? data.originalUrl.trim() : undefined;
        const requestedShortCodeRaw = typeof data.shortCode === 'string'
            ? data.shortCode.trim()
            : typeof data.customCode === 'string'
                ? data.customCode.trim()
                : undefined;
        if (data.password !== undefined && data.password !== link.password && !planLimits.canUsePassword) {
            throw new common_1.HttpException('Password protection is available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.expiresAt !== undefined && data.expiresAt !== link.expiresAt && !planLimits.canUseExpiration) {
            throw new common_1.HttpException('Link expiration requires the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.maxClicks !== undefined && data.maxClicks !== link.maxClicks && !planLimits.canUseClickLimit) {
            throw new common_1.HttpException('Click limits are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.singleUse !== undefined && data.singleUse !== link.singleUse && !planLimits.canUseSingleUseLinks) {
            throw new common_1.HttpException('One-time links are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        const landingPageChanged = data.landingTitle !== undefined ||
            data.landingDescription !== undefined ||
            data.landingButtonLabel !== undefined;
        if (landingPageChanged && !planLimits.canUseCustomLanding) {
            throw new common_1.HttpException('Custom landing pages are available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        const maxClicks = this.parseMaxClicks(data.maxClicks);
        const nextSingleUse = data.singleUse !== undefined ? Boolean(data.singleUse) : link.singleUse;
        if (nextOriginalUrl !== undefined && !nextOriginalUrl) {
            throw new common_1.BadRequestException('Original URL cannot be empty');
        }
        if (requestedShortCodeRaw !== undefined && requestedShortCodeRaw !== link.shortCode) {
            if (!requestedShortCodeRaw) {
                throw new common_1.BadRequestException('Short code cannot be empty');
            }
            if (!planLimits.canUseCustomCode) {
                throw new common_1.HttpException('Custom codes exist only on paid plans.', common_1.HttpStatus.FORBIDDEN);
            }
            const existingShortCode = await this.prisma.link.findUnique({
                where: { shortCode: requestedShortCodeRaw },
            });
            if (existingShortCode && existingShortCode.id !== link.id) {
                throw new common_1.ConflictException('This short code is already in use');
            }
        }
        const updatedLink = await this.prisma.link.update({
            where: { id },
            data: {
                originalUrl: nextOriginalUrl !== undefined ? nextOriginalUrl : link.originalUrl,
                shortCode: requestedShortCodeRaw !== undefined ? requestedShortCodeRaw : link.shortCode,
                isActive: data.isActive !== undefined ? data.isActive : link.isActive,
                password: data.password !== undefined ? data.password : link.password,
                expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : link.expiresAt,
                maxClicks: nextSingleUse
                    ? null
                    : maxClicks !== undefined
                        ? maxClicks
                        : link.maxClicks,
                singleUse: nextSingleUse,
                landingTitle: data.landingTitle !== undefined ? data.landingTitle?.trim() || null : link.landingTitle,
                landingDescription: data.landingDescription !== undefined
                    ? data.landingDescription?.trim() || null
                    : link.landingDescription,
                landingButtonLabel: data.landingButtonLabel !== undefined
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
        return updatedLink;
    }
    async remove(id, userId) {
        const link = await this.prisma.link.findFirst({ where: { id, userId } });
        if (!link)
            throw new common_1.NotFoundException('Link not found or unauthorized');
        return this.prisma.link.delete({
            where: { id },
        });
    }
    async recordClick(linkId, metadata) {
        const parser = new ua_parser_js_1.UAParser(metadata.userAgent);
        const result = parser.getResult();
        const updatedLink = await this.prisma.$transaction(async (tx) => {
            const link = await tx.link.findUnique({
                where: { id: linkId },
            });
            if (!link) {
                throw new common_1.NotFoundException('Link not found');
            }
            if (this.hasReachedClickLimit(link)) {
                if (link.isActive) {
                    await tx.link.update({
                        where: { id: linkId },
                        data: { isActive: false },
                    });
                }
                throw new common_1.NotFoundException('Link has expired.');
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
        void this.webhooksService.dispatchEvent(updatedLink.userId, 'link.clicked', {
            linkId: updatedLink.id,
            shortCode: updatedLink.shortCode,
            originalUrl: updatedLink.originalUrl,
            clicks: updatedLink.clicks,
        });
        return updatedLink;
    }
    async getAnalytics(id, userId) {
        const link = await this.prisma.link.findFirst({
            where: { id, userId },
            include: {
                clickEvents: {
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
            },
        });
        if (!link)
            throw new common_1.NotFoundException('Link not found');
        const totalClicks = link.clicks;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [browsers, os, referers, timeline] = await Promise.all([
            this.prisma.linkClick.groupBy({
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
            this.prisma.$queryRaw `
        SELECT date(createdAt) as date, count(*) as count
        FROM LinkClick
        WHERE linkId = ${id} AND createdAt > ${sevenDaysAgo}
        GROUP BY date(createdAt)
        ORDER BY date ASC
      `,
        ]);
        const formattedTimeline = (timeline || []).map((entry) => ({
            date: entry.date,
            count: Number(entry.count || 0)
        }));
        return {
            link,
            stats: {
                totalClicks: Number(totalClicks),
                browsers: browsers.map((b) => ({ name: b.browser, count: Number(b._count._all) })),
                os: os.map((o) => ({ name: o.os, count: Number(o._count._all) })),
                referers: referers.map((r) => ({ name: r.referer, count: Number(r._count._all) })),
                timeline: formattedTimeline,
                recentClicks: link.clickEvents,
            }
        };
    }
};
exports.LinksService = LinksService;
exports.LinksService = LinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhooks_service_1.WebhooksService])
], LinksService);
//# sourceMappingURL=links.service.js.map