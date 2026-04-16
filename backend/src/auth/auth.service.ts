import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${registerDto.username},email.eq.${registerDto.email}`)
      .single();

    if (existing) {
      throw new ConflictException('Username or email already exists');
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

    if (error) throw new Error(error.message);

    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${loginDto.identifier},email.eq.${loginDto.identifier}`)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update status to online
    await supabase
      .from('users')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', user.id);

    const token = this.jwtService.sign({ sub: user.id, username: user.username });

    const { password_hash, ...safeUser } = user;
    return { user: { ...safeUser, status: 'online' }, token };
  }

  async logout(userId: string) {
    const supabase = this.supabaseService.getClient();
    await supabase
      .from('users')
      .update({ status: 'offline', last_seen: new Date().toISOString() })
      .eq('id', userId);
    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, username, full_name, email, avatar_url, about, status')
      .eq('id', userId)
      .single();
    return user;
  }
}
