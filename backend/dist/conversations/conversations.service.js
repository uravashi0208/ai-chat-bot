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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let ConversationsService = class ConversationsService {
    constructor(supabaseService, chatGateway) {
        this.supabaseService = supabaseService;
        this.chatGateway = chatGateway;
    }
    async getUserConversations(userId) {
        const supabase = this.supabaseService.getClient();
        const { data } = await supabase
            .from("conversation_participants")
            .select(`
        conversation_id, last_read_at, is_muted, is_archived,
        conversation:conversations(
          id, type, name, avatar_url, description, last_message_at, created_at,
          last_message:last_message_id(id, content, type, sender_id, created_at),
          participants:conversation_participants(
            user:user_id(id, username, full_name, avatar_url, status, last_seen)
          )
        )
      `)
            .eq("user_id", userId)
            .eq("is_archived", false)
            .order("conversation_id", { ascending: false });
        const conversations = (data || []).map((p) => ({
            ...p.conversation,
            last_read_at: p.last_read_at,
            is_muted: p.is_muted,
            is_archived: p.is_archived,
        }));
        return conversations.sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime());
    }
    async findOrCreateDirectConversation(userId, targetUserId) {
        const supabase = this.supabaseService.getClient();
        const { data: existing } = await supabase.rpc("find_direct_conversation", {
            user1_id: userId,
            user2_id: targetUserId,
        });
        if (existing && existing.length > 0) {
            return this.getConversationById(existing[0].conversation_id, userId);
        }
        const { data: conversation, error } = await supabase
            .from("conversations")
            .insert({ type: "direct", created_by: userId })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        await supabase.from("conversation_participants").insert([
            { conversation_id: conversation.id, user_id: userId },
            { conversation_id: conversation.id, user_id: targetUserId },
        ]);
        const fullConversation = await this.getConversationById(conversation.id, userId);
        this.chatGateway.joinUserToConversation(userId, conversation.id);
        this.chatGateway.notifyNewConversation(targetUserId, fullConversation);
        return fullConversation;
    }
    async createGroupConversation(userId, name, participantIds, description) {
        const supabase = this.supabaseService.getClient();
        const { data: conversation, error } = await supabase
            .from("conversations")
            .insert({ type: "group", name, description, created_by: userId })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        const allParticipants = [...new Set([userId, ...participantIds])];
        await supabase.from("conversation_participants").insert(allParticipants.map((pid) => ({
            conversation_id: conversation.id,
            user_id: pid,
            role: pid === userId ? "admin" : "member",
        })));
        const fullConversation = await this.getConversationById(conversation.id, userId);
        participantIds.forEach((pid) => {
            if (pid !== userId) {
                this.chatGateway.joinUserToConversation(pid, conversation.id);
                this.chatGateway.notifyNewConversation(pid, fullConversation);
            }
        });
        return fullConversation;
    }
    async getConversationById(conversationId, userId) {
        const supabase = this.supabaseService.getClient();
        const { data: participant } = await supabase
            .from("conversation_participants")
            .select()
            .eq("conversation_id", conversationId)
            .eq("user_id", userId)
            .single();
        if (!participant)
            throw new common_1.ForbiddenException("Not a participant");
        const { data } = await supabase
            .from("conversations")
            .select(`
        id, type, name, avatar_url, description, last_message_at, created_at,
        last_message:last_message_id(id, content, type, sender_id, created_at),
        participants:conversation_participants(
          user:user_id(id, username, full_name, avatar_url, status, last_seen),
          role, last_read_at
        )
      `)
            .eq("id", conversationId)
            .single();
        return data;
    }
    async markAsRead(conversationId, userId) {
        const supabase = this.supabaseService.getClient();
        await supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversationId)
            .eq("user_id", userId);
        return { success: true };
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        chat_gateway_1.ChatGateway])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map