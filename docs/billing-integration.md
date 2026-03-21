# Billing Integration

## Goal

Replace the simulated plan upgrades with a real Stripe-based billing flow that keeps `user.plan` in sync from webhook events.

## Scope

- Stripe Checkout for new paid subscriptions
- Stripe Customer Portal for subscription management
- webhook-driven synchronization back into the local `User` model
- removal of user-controlled direct plan patching

## Implementation Actions

### 2026-03-18

- Started a dedicated backend `billing` module to keep payment logic separate from users, auth, and plans.
- Added Stripe billing fields to `User` for:
  - customer id
  - subscription id
  - price id
  - subscription status
  - current period end
  - cancel-at-period-end flag
- Enabled raw request body support in Nest so Stripe webhook signatures can be verified safely.
- Added a modular Stripe integration split into:
  - `billing.config.ts` for plan-to-price mapping
  - `stripe.service.ts` for Stripe client setup
  - `billing.service.ts` for checkout, portal, and webhook synchronization
  - `billing.controller.ts` for HTTP endpoints
- Implemented authenticated billing endpoints for:
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
- Implemented a public Stripe webhook endpoint at:
  - `POST /api/billing/webhook`
- Implemented webhook handling for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Made Stripe webhooks the source of truth for syncing paid plans back into the local user record.
- Removed direct user plan changes through `PATCH /api/users/me`; plan changes must now go through billing.
- Replaced simulated frontend upgrades with real billing actions:
  - checkout for `FREE` to paid
  - billing portal for existing paid subscribers
- Added Stripe env vars to `backend/.env.example`.

## Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
FRONTEND_URL=http://localhost:4200
```

## Notes

- The current flow intentionally uses checkout only for new paid subscriptions.
- Existing paid users are sent to the billing portal for upgrades, downgrades, payment-method changes, and cancellation.
- The Stripe customer portal must be configured in Stripe to allow the subscription changes you want users to self-serve.
- The admin area currently allows direct manual edits to `user.plan` for operational use.
- That means Stripe webhooks remain the long-term source of truth for subscriber sync, but manual admin overrides are still possible today.
- The exact conflict-resolution policy between admin plan edits and subsequent Stripe webhook events is still an open follow-up item.
