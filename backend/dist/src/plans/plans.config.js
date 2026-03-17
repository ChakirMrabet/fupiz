"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_FEATURES = void 0;
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
//# sourceMappingURL=plans.config.js.map