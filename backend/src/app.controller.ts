import { Controller, Get, Param, Res, Post, Body, NotFoundException, UnauthorizedException, Req } from '@nestjs/common';
import { LinksService } from './links/links.service';
import type { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
  constructor(private readonly linksService: LinksService) {}

  @Post('public/links')
  async createAnonymousLink(@Body() body: any, @Req() req: Request) {
    const link = await this.linksService.createAnonymous(body);

    return {
      shortCode: link.shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/s/${link.shortCode}`,
      originalUrl: link.originalUrl,
    };
  }

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

    if (this.linksService.hasReachedClickLimit(link)) {
      await this.linksService.deactivate(link.id);
      throw new NotFoundException('Link has expired.');
    }

    if (this.linksService.hasLandingPage(link)) {
      return res.redirect(`http://localhost:4200/go/${shortCode}`);
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
    if (this.linksService.hasReachedClickLimit(link)) {
      await this.linksService.deactivate(link.id);
      throw new NotFoundException('Link has expired.');
    }
    // Protected-link secrets are stored as bcrypt hashes, so unlock checks must
    // compare against the hash instead of reading plaintext from the database.
    if (!link.password || !body?.password || !(await bcrypt.compare(body.password, link.password))) {
      throw new UnauthorizedException('Incorrect password');
    }
    
    await this.linksService.recordClick(link.id, {
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
    });

    return { url: link.originalUrl };
  }

  @Get('public/links/:shortCode/landing')
  async getLandingPage(@Param('shortCode') shortCode: string) {
    const link = await this.linksService.findByShortCode(shortCode);
    if (!link || !link.isActive) {
      throw new NotFoundException('Link not found');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException('Link has expired.');
    }

    if (this.linksService.hasReachedClickLimit(link)) {
      await this.linksService.deactivate(link.id);
      throw new NotFoundException('Link has expired.');
    }

    return {
      shortCode: link.shortCode,
      landingTitle: link.landingTitle || 'You are about to open a link',
      landingDescription: link.landingDescription || 'Continue when you are ready.',
      landingButtonLabel: link.landingButtonLabel || (link.password ? 'Continue to Unlock' : 'Continue'),
      requiresPassword: Boolean(link.password),
      hasLandingPage: this.linksService.hasLandingPage(link),
    };
  }

  @Post('public/links/:shortCode/visit')
  async continueFromLanding(@Param('shortCode') shortCode: string, @Req() req: Request) {
    const link = await this.linksService.findByShortCode(shortCode);
    if (!link || !link.isActive) {
      throw new NotFoundException('Link not found');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new NotFoundException('Link has expired.');
    }

    if (this.linksService.hasReachedClickLimit(link)) {
      await this.linksService.deactivate(link.id);
      throw new NotFoundException('Link has expired.');
    }

    if (link.password) {
      return { requiresPassword: true };
    }

    await this.linksService.recordClick(link.id, {
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
    });

    return { url: link.originalUrl };
  }
}
