import { PlanId } from '../plans/plans.config';

export const STRIPE_BILLABLE_PLANS = ['PRO', 'BUSINESS'] as const;

export type StripeBillablePlanId = (typeof STRIPE_BILLABLE_PLANS)[number];

const STRIPE_PRICE_BY_PLAN: Record<StripeBillablePlanId, string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
};

export function isStripeBillablePlanId(value: string): value is StripeBillablePlanId {
  return STRIPE_BILLABLE_PLANS.includes(value as StripeBillablePlanId);
}

export function getStripePriceIdForPlan(planId: StripeBillablePlanId): string | null {
  return STRIPE_PRICE_BY_PLAN[planId] || null;
}

export function getPlanIdForStripePrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) {
    return null;
  }

  const matchedPlan = Object.entries(STRIPE_PRICE_BY_PLAN).find(
    ([, configuredPriceId]) => configuredPriceId === priceId,
  );

  return (matchedPlan?.[0] as PlanId | undefined) || null;
}
