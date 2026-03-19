import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  createCheckoutSession(@Request() req: any, @Body() body: { planId?: string }) {
    return this.billingService.createCheckoutSession(req.user.userId, body.planId || '');
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('portal')
  createPortalSession(@Request() req: any) {
    return this.billingService.createPortalSession(req.user.userId);
  }

  @HttpCode(200)
  @Post('webhook')
  handleWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: ExpressRequest & { rawBody?: Buffer },
  ) {
    return this.billingService.handleWebhook(signature, req.rawBody);
  }
}
