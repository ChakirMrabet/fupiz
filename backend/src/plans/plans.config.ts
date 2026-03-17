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

export const PLAN_FEATURES: Record<string, PlanConfig> = {
  FREE: {
    name: 'Free',
    price: '$0',
    description: 'Get started with the essentials.',
    maxLinks: 10,
    canUseCustomCode: false,
    canUsePassword: false,
    canUseExpiration: false,
    canAccessStats: false,
  },
  PRO: {
    name: 'Pro',
    price: '$5/mo',
    description: 'Unlock every feature and scale your links.',
    maxLinks: 500,
    canUseCustomCode: true,
    canUsePassword: true,
    canUseExpiration: true,
    canAccessStats: true,
  }
};

