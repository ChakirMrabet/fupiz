import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { LinksService } from './links.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.linksService.create(req.user.userId, body);
  }

  @Post('bulk')
  bulkCreate(@Request() req: any, @Body() body: any) {
    return this.linksService.bulkCreate(req.user.userId, body.entries);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.linksService.findAll(req.user.userId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.linksService.update(+id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.linksService.remove(+id, req.user.userId);
  }

  @Get(':id/analytics')
  getAnalytics(@Request() req: any, @Param('id') id: string) {
    return this.linksService.getAnalytics(+id, req.user.userId);
  }
}
