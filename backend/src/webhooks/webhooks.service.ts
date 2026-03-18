import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanConfig } from '../plans/plans.config';

export const WEBHOOK_EVENTS = ['link.created', 'link.updated', 'link.clicked'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  private normalizeEvents(events: unknown): WebhookEvent[] {
    if (!Array.isArray(events) || events.length === 0) {
      throw new BadRequestException('At least one webhook event must be selected');
    }

    const normalized = events.filter((event): event is WebhookEvent =>
      typeof event === 'string' && WEBHOOK_EVENTS.includes(event as WebhookEvent),
    );

    if (normalized.length !== events.length) {
      throw new BadRequestException('Invalid webhook event selection');
    }

    return Array.from(new Set(normalized));
  }

  private async assertBusinessPlan(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const planConfig = getPlanConfig(user.plan);
    if (!planConfig.canUseWebhooks) {
      throw new ForbiddenException('Webhooks are available on the Business plan.');
    }
  }

  private serializeEvents(events: WebhookEvent[]) {
    return events.join(',');
  }

  private deserializeEvents(events: string) {
    return events.split(',').filter(Boolean);
  }

  async findAll(userId: number) {
    await this.assertBusinessPlan(userId);

    const webhooks = await this.prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((webhook) => ({
      ...webhook,
      events: this.deserializeEvents(webhook.events),
    }));
  }

  async create(userId: number, body: any) {
    await this.assertBusinessPlan(userId);

    if (!body?.url) {
      throw new BadRequestException('Webhook URL is required');
    }

    const events = this.normalizeEvents(body.events);
    const secret = randomBytes(24).toString('hex');

    const webhook = await this.prisma.webhook.create({
      data: {
        userId,
        url: body.url.trim(),
        events: this.serializeEvents(events),
        secret,
      },
    });

    return {
      ...webhook,
      events,
    };
  }

  async update(userId: number, webhookId: number, body: any) {
    await this.assertBusinessPlan(userId);

    const existingWebhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!existingWebhook) {
      throw new NotFoundException('Webhook not found');
    }

    const updateData: any = {};

    if (body.url !== undefined) {
      updateData.url = body.url.trim();
    }

    if (body.events !== undefined) {
      updateData.events = this.serializeEvents(this.normalizeEvents(body.events));
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.rotateSecret) {
      updateData.secret = randomBytes(24).toString('hex');
    }

    const webhook = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: updateData,
    });

    return {
      ...webhook,
      events: this.deserializeEvents(webhook.events),
    };
  }

  async remove(userId: number, webhookId: number) {
    await this.assertBusinessPlan(userId);

    const existingWebhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, userId },
    });

    if (!existingWebhook) {
      throw new NotFoundException('Webhook not found');
    }

    return this.prisma.webhook.delete({
      where: { id: webhookId },
    });
  }

  async dispatchEvent(userId: number, event: WebhookEvent, payload: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const matchingWebhooks = webhooks.filter((webhook) =>
      this.deserializeEvents(webhook.events).includes(event),
    );

    await Promise.all(
      matchingWebhooks.map(async (webhook) => {
        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          payload,
        });

        const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');

        let status = 'failed';
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-fupiz-signature': signature,
            },
            body,
          });

          status = response.ok ? 'delivered' : `http_${response.status}`;
        } catch {
          status = 'network_error';
        }

        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastDeliveryAt: new Date(),
            lastDeliveryStatus: status,
          },
        });
      }),
    );
  }
}
