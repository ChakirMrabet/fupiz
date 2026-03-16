import { Controller, Get, Param, Res, Post, Body, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LinksService } from './links/links.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly linksService: LinksService) {}

  @Get('s/:shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    if (shortCode === 'api' || shortCode === 'favicon.ico') {
      return res.status(404).send('Not Found');
    }

    const link = await this.linksService.findByShortCode(shortCode);
    
    if (!link || !link.isActive) {
      throw new NotFoundException('Link not found or is deactivated.');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException('Link has expired.');
    }

    if (link.password) {
      return res.redirect(`http://localhost:4200/unlock/${shortCode}`);
    }

    await this.linksService.incrementClicks(link.id);
    return res.redirect(link.originalUrl);
  }

  @Post('s/:shortCode/verify-password')
  async verifyPassword(@Param('shortCode') shortCode: string, @Body() body: any) {
    const link = await this.linksService.findByShortCode(shortCode);
    if (!link || !link.isActive) throw new NotFoundException('Link not found');
    if (link.password !== body.password) throw new UnauthorizedException('Incorrect password');
    
    await this.linksService.incrementClicks(link.id);
    return { url: link.originalUrl };
  }
}
