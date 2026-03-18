export const PLAN_IDS = ['FREE', 'PRO', 'BUSINESS'] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export function getPlanConfig(plan: string | null | undefined): PlanConfig {
  const normalizedPlan = plan || '';
  return isPlanId(normalizedPlan) ? PLAN_FEATURES[normalizedPlan] : PLAN_FEATURES.FREE;
}

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

export const PLAN_FEATURES: Record<PlanId, PlanConfig> = {
  FREE: {
    name: 'Free',
    price: '$0',
    description: 'Get started with the essentials.',
    maxLinks: 10,
    canUseCustomCode: false,
    canUsePassword: false,
    canUseExpiration: false,
    canAccessStats: false,
    canEditDestination: true,
    canUseClickLimit: false,
    canUseSingleUseLinks: false,
    canUseCustomLanding: false,
    canUseBulkCreation: false,
    canUseWebhooks: false,
    canUseBrandedDomains: false,
  },
  PRO: {
    name: 'Pro',
    price: '$9/mo',
    description: 'Advanced link controls and richer analytics for individual power users.',
    maxLinks: 500,
    canUseCustomCode: true,
    canUsePassword: true,
    canUseExpiration: true,
    canAccessStats: true,
    canEditDestination: true,
    canUseClickLimit: true,
    canUseSingleUseLinks: true,
    canUseCustomLanding: true,
    canUseBulkCreation: false,
    canUseWebhooks: false,
    canUseBrandedDomains: false,
  },
  BUSINESS: {
    name: 'Business',
    price: '$29/mo',
    description: 'Automation, brand control, and high limits for teams and campaigns.',
    maxLinks: 5000,
    canUseCustomCode: true,
    canUsePassword: true,
    canUseExpiration: true,
    canAccessStats: true,
    canEditDestination: true,
    canUseClickLimit: true,
    canUseSingleUseLinks: true,
    canUseCustomLanding: true,
    canUseBulkCreation: true,
    canUseWebhooks: true,
    canUseBrandedDomains: true,
  },
};
