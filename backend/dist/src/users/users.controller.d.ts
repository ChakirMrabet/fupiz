import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: number;
        email: string;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        name: string | null;
        role: string;
        plan: string;
        stripePriceId: string | null;
        stripeSubscriptionStatus: string | null;
        stripeCurrentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
        isActive: boolean;
        activatedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: any, body: any): Promise<{
        id: number;
        email: string;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        name: string | null;
        role: string;
        plan: string;
        stripePriceId: string | null;
        stripeSubscriptionStatus: string | null;
        stripeCurrentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
        isActive: boolean;
        activatedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
