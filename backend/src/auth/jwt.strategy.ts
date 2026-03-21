import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { getEffectiveRole } from './admin-emails.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Verification must use the same fail-closed secret policy as token signing.
      secretOrKey: (() => {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
          throw new Error('JWT_SECRET must be configured');
        }

        return jwtSecret;
      })(),
    });
  }

  async validate(payload: any) {
    // Never trust long-lived role claims from the token for admin decisions.
    // Re-loading the user on every request lets role revocations and deactivations
    // take effect immediately instead of waiting for token expiry.
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is no longer allowed to authenticate');
    }

    return {
      userId: user.id,
      email: user.email,
      role: getEffectiveRole(user),
    };
  }
}
