import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MailModule, UsersModule],
  controllers: [SupportController],
})
export class SupportModule {}
