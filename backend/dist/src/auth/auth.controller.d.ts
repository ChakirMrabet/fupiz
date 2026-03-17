import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        message: string;
    }>;
    activate(body: any): Promise<{
        message: string;
        status: string;
    }>;
    login(body: any): Promise<{
        access_token: string;
    }>;
}
