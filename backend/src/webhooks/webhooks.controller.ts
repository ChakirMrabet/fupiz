import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebhooksService } from './webhooks.service';

@UseGuards(AuthGuard('jwt'))
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.webhooksService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.webhooksService.create(req.user.userId, body);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.webhooksService.update(req.user.userId, +id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.webhooksService.remove(req.user.userId, +id);
  }
}
