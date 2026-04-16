import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: any;
            username: any;
            full_name: any;
            email: any;
            phone: any;
            avatar_url: any;
            about: any;
            status: any;
            created_at: any;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: any;
        token: string;
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getMe(req: any): {
        user: any;
    };
}
