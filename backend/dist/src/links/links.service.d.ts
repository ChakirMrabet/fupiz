import { PrismaService } from '../prisma/prisma.service';
import { Link } from '@prisma/client';
import { WebhooksService } from '../webhooks/webhooks.service';
export declare class LinksService {
    private prisma;
    private webhooksService;
    constructor(prisma: PrismaService, webhooksService: WebhooksService);
    generateShortCode(): string;
    private parseMaxClicks;
    getEffectiveMaxClicks(link: {
        maxClicks: number | null;
        singleUse: boolean;
    }): number | null;
    hasReachedClickLimit(link: {
        clicks: number;
        maxClicks: number | null;
        singleUse: boolean;
    }): boolean;
    hasLandingPage(link: {
        landingTitle: string | null;
        landingDescription: string | null;
        landingButtonLabel: string | null;
    }): boolean;
    create(userId: number, data: any): Promise<Link>;
    bulkCreate(userId: number, entries: any[]): Promise<{
        createdCount: number;
        failedCount: number;
        results: ({
            index: number;
            success: boolean;
            link: {
                id: number;
                password: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                userId: number;
                originalUrl: string;
                shortCode: string;
                expiresAt: Date | null;
                maxClicks: number | null;
                singleUse: boolean;
                landingTitle: string | null;
                landingDescription: string | null;
                landingButtonLabel: string | null;
                clicks: number;
            };
            error?: undefined;
        } | {
            index: number;
            success: boolean;
            error: any;
            link?: undefined;
        })[];
    }>;
    findAll(userId: number): Promise<Link[]>;
    findByShortCode(shortCode: string): Promise<Link | null>;
    update(id: number, userId: number, data: any): Promise<Link>;
    remove(id: number, userId: number): Promise<Link>;
    recordClick(linkId: number, metadata: {
        ip: string;
        userAgent: string;
        referer: string;
    }): Promise<{
        id: number;
        password: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        originalUrl: string;
        shortCode: string;
        expiresAt: Date | null;
        maxClicks: number | null;
        singleUse: boolean;
        landingTitle: string | null;
        landingDescription: string | null;
        landingButtonLabel: string | null;
        clicks: number;
    }>;
    getAnalytics(id: number, userId: number): Promise<{
        link: any;
        stats: {
            totalClicks: number;
            browsers: any;
            os: {
                name: any;
                count: number;
            }[];
            referers: {
                name: any;
                count: number;
            }[];
            timeline: any;
            recentClicks: any;
        };
    }>;
}
