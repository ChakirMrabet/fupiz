import { LinksService } from './links.service';
export declare class LinksController {
    private readonly linksService;
    constructor(linksService: LinksService);
    create(req: any, body: any): Promise<{
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
    bulkCreate(req: any, body: any): Promise<{
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
    findAll(req: any): Promise<{
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
    }[]>;
    update(req: any, id: string, body: any): Promise<{
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
    remove(req: any, id: string): Promise<{
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
    getAnalytics(req: any, id: string): Promise<{
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
