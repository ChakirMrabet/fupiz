import { PrismaService } from '../prisma/prisma.service';
import { Link } from '@prisma/client';
export declare class LinksService {
    private prisma;
    constructor(prisma: PrismaService);
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
        originalUrl: string;
        shortCode: string;
        password: string | null;
        expiresAt: Date | null;
        maxClicks: number | null;
        singleUse: boolean;
        landingTitle: string | null;
        landingDescription: string | null;
        landingButtonLabel: string | null;
        isActive: boolean;
        clicks: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
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
