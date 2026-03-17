import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        name: string | null;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        plan: string;
    }>;
    updateProfile(req: any, body: any): Promise<{
        name: string | null;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        plan: string;
    }>;
}
