import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  private readonly from = process.env.MAIL_FROM;
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  private ensureConfigured() {
    if (!this.from || !process.env.SMTP_HOST) {
      throw new InternalServerErrorException('Email delivery is not configured');
    }
  }

  async sendActivationEmail(email: string, token: string) {
    this.ensureConfigured();

    const activationUrl = new URL('/activate-account', this.frontendUrl);
    activationUrl.searchParams.set('token', token);

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Activate your Fupiz account',
      text: [
        'Welcome to Fupiz.',
        '',
        'Activate your account by opening this link:',
        activationUrl.toString(),
        '',
        'This link expires automatically.',
      ].join('\n'),
      html: [
        '<p>Welcome to Fupiz.</p>',
        `<p><a href="${activationUrl.toString()}">Activate your account</a></p>`,
        '<p>This link expires automatically.</p>',
      ].join(''),
    });
  }
}
