import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;

  get client() {
    if (this.stripe) {
      return this.stripe;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException('Stripe is not configured');
    }

    this.stripe = new Stripe(secretKey);
    return this.stripe;
  }
}
