import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: number;
        email: string;
        name: string | null;
        plan: string;
        isActive: boolean;
        activatedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: any, body: any): Promise<{
        id: number;
        email: string;
        name: string | null;
        plan: string;
        isActive: boolean;
        activatedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
