"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    constructor(supabaseService, jwtService) {
        this.supabaseService = supabaseService;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const supabase = this.supabaseService.getClient();
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${registerDto.username},email.eq.${registerDto.email}`)
            .single();
        if (existing) {
            throw new common_1.ConflictException('Username or email already exists');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, 12);
        const { data: user, error } = await supabase
            .from('users')
            .insert({
            username: registerDto.username,
            full_name: registerDto.fullName,
            email: registerDto.email,
            phone: registerDto.phone,
            password_hash: passwordHash,
            status: 'online',
        })
            .select('id, username, full_name, email, phone, avatar_url, about, status, created_at')
            .single();
        if (error)
            throw new Error(error.message);
        const token = this.jwtService.sign({ sub: user.id, username: user.username });
        return { user, token };
    }
    async login(loginDto) {
        const supabase = this.supabaseService.getClient();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${loginDto.identifier},email.eq.${loginDto.identifier}`)
            .single();
        if (error || !user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(loginDto.password, user.password_hash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await supabase
            .from('users')
            .update({ status: 'online', last_seen: new Date().toISOString() })
            .eq('id', user.id);
        const token = this.jwtService.sign({ sub: user.id, username: user.username });
        const { password_hash, ...safeUser } = user;
        return { user: { ...safeUser, status: 'online' }, token };
    }
    async logout(userId) {
        const supabase = this.supabaseService.getClient();
        await supabase
            .from('users')
            .update({ status: 'offline', last_seen: new Date().toISOString() })
            .eq('id', userId);
        return { message: 'Logged out successfully' };
    }
    async validateUser(userId) {
        const supabase = this.supabaseService.getClient();
        const { data: user } = await supabase
            .from('users')
            .select('id, username, full_name, email, avatar_url, about, status')
            .eq('id', userId)
            .single();
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map