import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  getPlanIdForStripePrice,
  getStripePriceIdForPlan,
  isStripeBillablePlanId,
  StripeBillablePlanId,
} from './billing.config';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(userId: number, requestedPlanId: string) {
    if (!isStripeBillablePlanId(requestedPlanId)) {
      throw new BadRequestException('Unsupported billing plan');
    }

    const priceId = getStripePriceIdForPlan(requestedPlanId);
    if (!priceId) {
      throw new InternalServerErrorException(
        `Stripe price is not configured for the ${requestedPlanId} plan`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.plan !== 'FREE' && user.stripeSubscriptionId) {
      throw new ConflictException(
        'You already have a paid subscription. Use the billing portal to manage it.',
      );
    }

    const customerId = await this.ensureStripeCustomer(user);

    const session = await this.stripeService.client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${this.frontendUrl}/dashboard?billing=success`,
      cancel_url: `${this.frontendUrl}/pricing?billing=cancelled`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: String(user.id),
      metadata: {
        userId: String(user.id),
        planId: requestedPlanId,
      },
      subscription_data: {
        metadata: {
          userId: String(user.id),
          planId: requestedPlanId,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new InternalServerErrorException('Stripe checkout session did not return a URL');
    }

    return { url: session.url };
  }

  async createPortalSession(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for this account');
    }

    const session = await this.stripeService.client.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/dashboard?billing=portal`,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer | string | undefined) {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook secret is not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    if (!rawBody) {
      throw new BadRequestException('Missing Stripe webhook payload');
    }

    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          await this.syncSubscriptionById(subscriptionId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  private async ensureStripeCustomer(user: {
    id: number;
    email: string;
    name: string | null;
    stripeCustomerId: string | null;
  }) {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripeService.client.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: String(user.id),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  private async syncSubscriptionById(subscriptionId: string) {
    const subscription = await this.stripeService.client.subscriptions.retrieve(
      subscriptionId,
    );

    await this.syncSubscription(subscription);
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) {
      this.logger.warn(`Stripe subscription ${subscription.id} has no customer id`);
      return;
    }

    const metadataUserId = Number(subscription.metadata?.userId || 0) || null;
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { stripeCustomerId: customerId },
          ...(metadataUserId ? [{ id: metadataUserId }] : []),
        ],
      },
    });

    if (!user) {
      this.logger.warn(
        `Could not match Stripe subscription ${subscription.id} to a local user`,
      );
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id || null;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end || null;
    const mappedPlan = getPlanIdForStripePrice(priceId);
    const hasEntitlement = this.subscriptionStatusHasEntitlement(subscription.status);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: hasEntitlement && mappedPlan ? mappedPlan : 'FREE',
        stripeCustomerId: customerId,
        stripeSubscriptionId: hasEntitlement ? subscription.id : null,
        stripePriceId: hasEntitlement ? priceId : null,
        stripeSubscriptionStatus: subscription.status,
        stripeCurrentPeriodEnd:
          hasEntitlement && currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
        cancelAtPeriodEnd: Boolean(
          hasEntitlement && subscription.cancel_at_period_end,
        ),
      },
    });
  }

  private subscriptionStatusHasEntitlement(status: Stripe.Subscription.Status) {
    return ['active', 'trialing', 'past_due'].includes(status);
  }
}
