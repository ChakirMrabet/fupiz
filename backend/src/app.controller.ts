import { Controller, Get, Param, Res, Post, Body, NotFoundException, UnauthorizedException, Req } from '@nestjs/common';
import { LinksService } from './links/links.service';
import type { Response, Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly linksService: LinksService) {}

  @Get('s/:shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response, @Req() req: Request) {
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

    if (link.maxClicks !== null && link.clicks >= link.maxClicks) {
      await this.linksService.update(link.id, link.userId, { isActive: false });
      throw new NotFoundException('Link has expired.');
    }

    if (link.password) {
      return res.redirect(`http://localhost:4200/unlock/${shortCode}`);
    }

    await this.linksService.recordClick(link.id, {
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
    });

    return res.redirect(link.originalUrl);
  }

  @Post('s/:shortCode/verify-password')
  async verifyPassword(@Param('shortCode') shortCode: string, @Body() body: any, @Req() req: Request) {
    const link = await this.linksService.findByShortCode(shortCode);
    if (!link || !link.isActive) throw new NotFoundException('Link not found');
    if (link.expiresAt && link.expiresAt < new Date()) throw new NotFoundException('Link has expired.');
    if (link.maxClicks !== null && link.clicks >= link.maxClicks) {
      await this.linksService.update(link.id, link.userId, { isActive: false });
      throw new NotFoundException('Link has expired.');
    }
    if (link.password !== body.password) throw new UnauthorizedException('Incorrect password');
    
    await this.linksService.recordClick(link.id, {
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
    });

    return { url: link.originalUrl };
  }
}
