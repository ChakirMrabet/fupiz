import { Controller, Get, Patch, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { password, activationToken, activationTokenExpiresAt, ...result } = user;
    return result; // Includes 'plan' implicitly
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() body: any) {
    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    if (body.plan !== undefined) {
      throw new BadRequestException('Plan changes must go through billing');
    }
    
    const user = await this.usersService.update(req.user.userId, updateData);
    const { password, activationToken, activationTokenExpiresAt, ...result } = user;
    return result;
  }
}
