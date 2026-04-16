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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let UsersService = class UsersService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findById(id) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('id, username, full_name, email, phone, avatar_url, about, status, last_seen, created_at')
            .eq('id', id)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('User not found');
        return data;
    }
    async searchUsers(query, currentUserId) {
        const supabase = this.supabaseService.getClient();
        const { data } = await supabase
            .from('users')
            .select('id, username, full_name, avatar_url, about, status, last_seen')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .neq('id', currentUserId)
            .limit(20);
        return data || [];
    }
    async updateProfile(userId, updates) {
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
        if (error)
            throw new Error(error.message);
        return data;
    }
    async updateStatus(userId, status) {
        const supabase = this.supabaseService.getClient();
        await supabase
            .from('users')
            .update({ status, last_seen: new Date().toISOString() })
            .eq('id', userId);
    }
    async getContacts(userId) {
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
    async addContact(userId, contactId, nickname) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('contacts')
            .upsert({ user_id: userId, contact_id: contactId, nickname })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map