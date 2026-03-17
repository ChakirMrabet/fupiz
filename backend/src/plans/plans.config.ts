export interface PlanConfig {
  maxLinks: number;
  canUseCustomCode: boolean;
  canUsePassword: boolean;
  canUseExpiration: boolean;
  canAccessStats: boolean;
}

export const PLAN_FEATURES: Record<string, PlanConfig> = {
  FREE: {
    maxLinks: 10,
    canUseCustomCode: false,
    canUsePassword: false,
    canUseExpiration: false,
    canAccessStats: false,
  },
  PRO: {
    maxLinks: 500,
    canUseCustomCode: true,
    canUsePassword: true,
    canUseExpiration: true,
    canAccessStats: true,
  }
};
