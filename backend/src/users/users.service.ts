import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, phone, avatar_url, about, status, last_seen, created_at')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

  async searchUsers(query: string, currentUserId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, about, status, last_seen')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(20);
    return data || [];
  }

  async updateProfile(userId: string, updates: any) {
    const supabase = this.supabaseService.getClient();
    const allowed = ['full_name', 'about', 'avatar_url', 'phone'];
    const filtered = Object.keys(updates)
      .filter((k) => allowed.includes(k))
      .reduce((acc, k) => ({ ...acc, [k]: updates[k] }), {});

    const { data, error } = await supabase
      .from('users')
      .update(filtered)
      .eq('id', userId)
      .select('id, username, full_name, email, phone, avatar_url, about, status')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away') {
    const supabase = this.supabaseService.getClient();
    await supabase
      .from('users')
      .update({ status, last_seen: new Date().toISOString() })
      .eq('id', userId);
  }

  async getContacts(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('contacts')
      .select(`
        id, nickname, is_blocked, created_at,
        contact:contact_id(id, username, full_name, avatar_url, about, status, last_seen)
      `)
      .eq('user_id', userId)
      .eq('is_blocked', false);
    return data || [];
  }

  async addContact(userId: string, contactId: string, nickname?: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('contacts')
      .upsert({ user_id: userId, contact_id: contactId, nickname })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}
