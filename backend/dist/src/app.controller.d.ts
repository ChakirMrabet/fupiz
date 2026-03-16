import { LinksService } from './links/links.service';
import type { Response } from 'express';
export declare class AppController {
    private readonly linksService;
    constructor(linksService: LinksService);
    redirect(shortCode: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    verifyPassword(shortCode: string, body: any): Promise<{
        url: string;
    }>;
}
