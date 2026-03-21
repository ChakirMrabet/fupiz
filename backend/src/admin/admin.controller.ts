import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
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
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('plan') plan?: string,
    @Query('isActive') isActive?: string,
    @Query('subscriptionStatus') subscriptionStatus?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listUsers({
      search,
      role,
      plan,
      isActive,
      subscriptionStatus,
      page,
      pageSize,
    });
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
    return this.adminService.updateUser(Number(id), body, {
      actorUserId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('users/:id/links')
  getUserLinks(@Param('id') id: string) {
    return this.adminService.getUserLinks(Number(id));
  }

  @Get('links')
  listLinks(
    @Query('search') search?: string,
    @Query('ownerType') ownerType?: string,
    @Query('isActive') isActive?: string,
    @Query('plan') plan?: string,
    @Query('subscriptionStatus') subscriptionStatus?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listLinks({
      search,
      ownerType,
      isActive,
      plan,
      subscriptionStatus,
      page,
      pageSize,
    });
  }

  @Get('audit-logs')
  listAuditLogs(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listAuditLogs({
      search,
      action,
      targetType,
      page,
      pageSize,
    });
  }

  @Patch('links/:id')
  updateLink(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.adminService.updateLink(Number(id), body, {
      actorUserId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete('links/:id')
  removeLink(@Param('id') id: string, @Request() req: any) {
    return this.adminService.removeLink(Number(id), {
      actorUserId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
