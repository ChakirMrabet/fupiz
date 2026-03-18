"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_FEATURES = exports.PLAN_IDS = void 0;
exports.isPlanId = isPlanId;
exports.getPlanConfig = getPlanConfig;
exports.PLAN_IDS = ['FREE', 'PRO', 'BUSINESS'];
function isPlanId(value) {
    return exports.PLAN_IDS.includes(value);
}
function getPlanConfig(plan) {
    const normalizedPlan = plan || '';
    return isPlanId(normalizedPlan) ? exports.PLAN_FEATURES[normalizedPlan] : exports.PLAN_FEATURES.FREE;
}
exports.PLAN_FEATURES = {
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
//# sourceMappingURL=plans.config.js.map