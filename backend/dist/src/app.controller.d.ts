import { LinksService } from './links/links.service';
import type { Response, Request } from 'express';
export declare class AppController {
    private readonly linksService;
    constructor(linksService: LinksService);
    redirect(shortCode: string, res: Response, req: Request): Promise<void | Response<any, Record<string, any>>>;
    verifyPassword(shortCode: string, body: any, req: Request): Promise<{
        url: string;
    }>;
    getLandingPage(shortCode: string): Promise<{
        shortCode: string;
        landingTitle: string;
        landingDescription: string;
        landingButtonLabel: string;
        requiresPassword: boolean;
        hasLandingPage: boolean;
    }>;
    continueFromLanding(shortCode: string, req: Request): Promise<{
        requiresPassword: boolean;
        url?: undefined;
    } | {
        url: string;
        requiresPassword?: undefined;
    }>;
}
