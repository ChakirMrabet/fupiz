import { Body, Controller, Get, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(Number(id));
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (Number(id) === req.user.userId && body.role === 'USER') {
      delete body.role;
    }
    return this.adminService.updateUser(Number(id), body);
  }

  @Get('users/:id/links')
  getUserLinks(@Param('id') id: string) {
    return this.adminService.getUserLinks(Number(id));
  }

  @Patch('links/:id')
  updateLink(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateLink(Number(id), body);
  }
}
