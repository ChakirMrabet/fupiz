import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { PlansModule } from './plans/plans.module';
import { MailModule } from './mail/mail.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    LinksModule,
    PlansModule,
    MailModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
