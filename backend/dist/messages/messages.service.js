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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let MessagesService = class MessagesService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getMessages(conversationId, userId, limit = 50, before) {
        const supabase = this.supabaseService.getClient();
        const { data: participant } = await supabase
            .from('conversation_participants')
            .select()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();
        if (!participant)
            throw new common_1.ForbiddenException('Not a participant');
        let query = supabase
            .from('messages')
            .select(`
        id, content, type, media_url, media_thumbnail, media_size, media_duration,
        is_deleted, is_forwarded, edited_at, created_at, status,
        sender:sender_id(id, username, full_name, avatar_url),
        reply_to:reply_to_id(
          id, content, type,
          sender:sender_id(id, username, full_name)
        ),
        reactions:message_reactions(id, emoji, user_id)
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (before) {
            query = query.lt('created_at', before);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return (data || []).reverse();
    }
    async sendMessage(conversationId, senderId, content, type = 'text', options = {}) {
        const supabase = this.supabaseService.getClient();
        const { data: participant } = await supabase
            .from('conversation_participants')
            .select()
            .eq('conversation_id', conversationId)
            .eq('user_id', senderId)
            .single();
        if (!participant)
            throw new common_1.ForbiddenException('Not a participant');
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            type,
            media_url: options.mediaUrl,
            media_thumbnail: options.mediaThumbnail,
            media_size: options.mediaSize,
            media_duration: options.mediaDuration,
            reply_to_id: options.replyToId,
            is_forwarded: options.isForwarded || false,
            status: 'sent',
        })
            .select(`
        id, content, type, media_url, media_thumbnail, media_size, media_duration,
        is_deleted, is_forwarded, edited_at, created_at, status,
        sender:sender_id(id, username, full_name, avatar_url),
        reply_to:reply_to_id(
          id, content, type,
          sender:sender_id(id, username, full_name)
        )
      `)
            .single();
        if (error)
            throw new Error(error.message);
        await supabase
            .from('conversations')
            .update({
            last_message_id: message.id,
            last_message_at: message.created_at,
        })
            .eq('id', conversationId);
        return message;
    }
    async editMessage(messageId, userId, content) {
        const supabase = this.supabaseService.getClient();
        const { data: msg } = await supabase
            .from('messages')
            .select()
            .eq('id', messageId)
            .eq('sender_id', userId)
            .single();
        if (!msg)
            throw new common_1.ForbiddenException('Cannot edit this message');
        const { data, error } = await supabase
            .from('messages')
            .update({ content, edited_at: new Date().toISOString() })
            .eq('id', messageId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async deleteMessage(messageId, userId) {
        const supabase = this.supabaseService.getClient();
        const { data: msg } = await supabase
            .from('messages')
            .select()
            .eq('id', messageId)
            .eq('sender_id', userId)
            .single();
        if (!msg)
            throw new common_1.ForbiddenException('Cannot delete this message');
        const { data } = await supabase
            .from('messages')
            .update({ is_deleted: true, content: null, type: 'deleted' })
            .eq('id', messageId)
            .select()
            .single();
        return data;
    }
    async addReaction(messageId, userId, emoji) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('message_reactions')
            .upsert({ message_id: messageId, user_id: userId, emoji })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async removeReaction(messageId, userId, emoji) {
        const supabase = this.supabaseService.getClient();
        await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji);
        return { success: true };
    }
    async updateMessageStatus(conversationId, userId, status) {
        const supabase = this.supabaseService.getClient();
        const { data: messages } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);
        if (!messages || messages.length === 0)
            return;
        const records = messages.map((m) => ({
            message_id: m.id,
            user_id: userId,
            status,
        }));
        await supabase.from('message_status').upsert(records);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map