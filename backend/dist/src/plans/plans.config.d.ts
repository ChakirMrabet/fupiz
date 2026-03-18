export declare const PLAN_IDS: readonly ["FREE", "PRO", "BUSINESS"];
export type PlanId = (typeof PLAN_IDS)[number];
export declare function isPlanId(value: string): value is PlanId;
export declare function getPlanConfig(plan: string | null | undefined): PlanConfig;
export interface PlanConfig {
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
}
export declare const PLAN_FEATURES: Record<PlanId, PlanConfig>;
