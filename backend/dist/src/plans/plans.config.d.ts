export interface PlanConfig {
    name: string;
    price: string;
    description: string;
    maxLinks: number;
    canUseCustomCode: boolean;
    canUsePassword: boolean;
    canUseExpiration: boolean;
    canAccessStats: boolean;
}
export declare const PLAN_FEATURES: Record<string, PlanConfig>;
