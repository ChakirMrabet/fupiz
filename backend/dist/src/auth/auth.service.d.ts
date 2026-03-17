import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private mailService;
    private readonly activationTtlHours;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(data: any): Promise<{
        message: string;
    }>;
    activateAccount(token: string): Promise<{
        message: string;
        status: string;
    }>;
}
