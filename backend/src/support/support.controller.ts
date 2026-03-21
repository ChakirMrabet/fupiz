import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Controller()
export class SupportController {
  constructor(
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  @Post('public/contact')
  async submitPublicContact(@Body() body: any) {
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !subject || !message) {
      throw new BadRequestException('Name, email, subject, and message are required');
    }

    await this.mailService.sendPublicContactEmail({
      name,
      email,
      subject,
      message,
    });

    return { message: 'Your message has been sent.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('support')
  async submitDashboardSupport(@Request() req: any, @Body() body: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const subject = String(body?.subject || '').trim();
    const category = String(body?.category || '').trim();
    const message = String(body?.message || '').trim();

    if (!subject || !category || !message) {
      throw new BadRequestException('Subject, category, and message are required');
    }

    await this.mailService.sendDashboardSupportEmail({
      userEmail: user.email,
      userName: user.name,
      subject,
      category,
      message,
    });

    return { message: 'Your support request has been sent.' };
  }
}
