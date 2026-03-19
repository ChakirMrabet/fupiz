import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AnonymousLinksCleanupService } from './anonymous-links-cleanup.service';

@Module({
  imports: [WebhooksModule],
  providers: [LinksService, AnonymousLinksCleanupService],
  controllers: [LinksController],
  exports: [LinksService],
})
export class LinksModule {}
