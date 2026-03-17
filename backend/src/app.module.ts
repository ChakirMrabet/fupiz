import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { PlansModule } from './plans/plans.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, LinksModule, PlansModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
