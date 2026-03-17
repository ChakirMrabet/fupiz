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
const plans_config_1 = require("../plans/plans.config");
let LinksService = class LinksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateShortCode() {
        return (0, crypto_1.randomBytes)(4).toString('hex');
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
        const userPlan = user.plan || 'FREE';
        const planLimits = plans_config_1.PLAN_FEATURES[userPlan] || plans_config_1.PLAN_FEATURES['FREE'];
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
        const userPlan = link.user.plan || 'FREE';
        const planLimits = plans_config_1.PLAN_FEATURES[userPlan] || plans_config_1.PLAN_FEATURES['FREE'];
        if (data.password !== undefined && data.password !== link.password && !planLimits.canUsePassword) {
            throw new common_1.HttpException('Password protection is available on the PRO plan.', common_1.HttpStatus.FORBIDDEN);
        }
        if (data.expiresAt !== undefined && data.expiresAt !== link.expiresAt && !planLimits.canUseExpiration) {
            throw new common_1.HttpException('Link expiration requires the PRO plan.', common_1.HttpStatus.FORBIDDEN);
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
    async remove(id, userId) {
        const link = await this.prisma.link.findFirst({ where: { id, userId } });
        if (!link)
            throw new common_1.NotFoundException('Link not found or unauthorized');
        return this.prisma.link.delete({
            where: { id },
        });
    }
    async incrementClicks(id) {
        return this.prisma.link.update({
            where: { id },
            data: { clicks: { increment: 1 } },
        });
    }
};
exports.LinksService = LinksService;
exports.LinksService = LinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LinksService);
//# sourceMappingURL=links.service.js.map