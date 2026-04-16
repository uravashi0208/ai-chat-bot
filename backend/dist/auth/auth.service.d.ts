import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private supabaseService;
    private jwtService;
    constructor(supabaseService: SupabaseService, jwtService: JwtService);
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
    logout(userId: string): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<{
        id: any;
        username: any;
        full_name: any;
        email: any;
        avatar_url: any;
        about: any;
        status: any;
    }>;
}
