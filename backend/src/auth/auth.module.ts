import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';

function getJwtSecret() {
  // Authentication must fail closed. Falling back to a baked-in secret would make
  // every protected dashboard/admin endpoint forgeable when env config is missing.
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be configured');
  }

  return jwtSecret;
}

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      // Tokens remain long-lived for the current product flow, so role and active-state
      // checks are re-hydrated from the database on every authenticated request.
      signOptions: { expiresIn: '60d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
