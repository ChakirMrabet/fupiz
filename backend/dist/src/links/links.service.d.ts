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
    incrementClicks(id: number): Promise<{
        id: number;
        originalUrl: string;
        shortCode: string;
        password: string | null;
        expiresAt: Date | null;
        isActive: boolean;
        clicks: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
