import { LinksService } from './links.service';
export declare class LinksController {
    private readonly linksService;
    constructor(linksService: LinksService);
    create(req: any, body: any): Promise<{
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
    findAll(req: any): Promise<{
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
    }[]>;
    update(req: any, id: string, body: any): Promise<{
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
    remove(req: any, id: string): Promise<{
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
