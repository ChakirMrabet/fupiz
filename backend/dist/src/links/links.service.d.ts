import { PrismaService } from '../prisma/prisma.service';
import { Link } from '@prisma/client';
export declare class LinksService {
    private prisma;
    constructor(prisma: PrismaService);
    generateShortCode(): string;
    create(userId: number, data: any): Promise<Link>;
    findAll(userId: number): Promise<Link[]>;
    findByShortCode(shortCode: string): Promise<Link | null>;
    update(id: number, userId: number, data: any): Promise<Link>;
    remove(id: number, userId: number): Promise<Link>;
    recordClick(linkId: number, metadata: {
        ip: string;
        userAgent: string;
        referer: string;
    }): Promise<any>;
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
