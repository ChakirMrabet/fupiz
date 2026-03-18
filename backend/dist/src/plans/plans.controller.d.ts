export declare class PlansController {
    getPlans(): {
        name: string;
        price: string;
        description: string;
        maxLinks: number;
        canUseCustomCode: boolean;
        canUsePassword: boolean;
        canUseExpiration: boolean;
        canAccessStats: boolean;
        canEditDestination: boolean;
        canUseClickLimit: boolean;
        canUseSingleUseLinks: boolean;
        canUseCustomLanding: boolean;
        canUseBulkCreation: boolean;
        canUseWebhooks: boolean;
        canUseBrandedDomains: boolean;
        id: "FREE" | "PRO" | "BUSINESS";
    }[];
}
