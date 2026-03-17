import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly activationTtlHours = Number(process.env.ACCOUNT_ACTIVATION_TTL_HOURS || 24);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account not activated. Check your email.');
      }

      const { password, activationToken, activationTokenExpiresAt, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: any) {
    if (!data?.email || !data?.password) {
      throw new BadRequestException('Email and password are required');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const activationToken = randomBytes(32).toString('hex');
    const activationTokenExpiresAt = new Date(
      Date.now() + this.activationTtlHours * 60 * 60 * 1000,
    );

    const existingUser = await this.usersService.findOne(data.email);

    if (existingUser?.isActive) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = existingUser
      ? await this.usersService.update(existingUser.id, {
          password: hashedPassword,
          activationToken,
          activationTokenExpiresAt,
          activatedAt: null,
          isActive: false,
        })
      : await this.usersService.create({
          email: data.email,
          password: hashedPassword,
          activationToken,
          activationTokenExpiresAt,
        });

    try {
      await this.mailService.sendActivationEmail(user.email, activationToken);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to send activation email');
    }

    return {
      message: 'Account created. Check your email to activate it.',
    };
  }

  async activateAccount(token: string) {
    if (!token) {
      throw new BadRequestException('Activation token is required');
    }

    const user = await this.usersService.findByActivationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid activation link');
    }

    if (user.isActive) {
      return {
        message: 'Account already activated',
        status: 'already_active',
      };
    }

    if (!user.activationTokenExpiresAt || user.activationTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Activation link has expired');
    }

    await this.usersService.update(user.id, {
      isActive: true,
      activationToken: null,
      activationTokenExpiresAt: null,
      activatedAt: new Date(),
    });

    return {
      message: 'Account activated successfully',
      status: 'activated',
    };
  }
}
