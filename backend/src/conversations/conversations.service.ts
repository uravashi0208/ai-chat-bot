import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { ChatGateway } from "../chat/chat.gateway";

@Injectable()
export class ConversationsService {
  constructor(
    private supabaseService: SupabaseService,
    // FIX #3: Inject ChatGateway (forwardRef to avoid circular dependency)
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async getUserConversations(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation_id, last_read_at, is_muted, is_archived,
        conversation:conversations(
          id, type, name, avatar_url, description, last_message_at, created_at,
          last_message:last_message_id(id, content, type, sender_id, created_at),
          participants:conversation_participants(
            user:user_id(id, username, full_name, avatar_url, status, last_seen)
          )
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("conversation_id", { ascending: false });

    const conversations = (data || []).map((p) => ({
      ...p.conversation,
      last_read_at: p.last_read_at,
      is_muted: p.is_muted,
      is_archived: p.is_archived,
    }));

    // Sort by last_message_at desc
    return conversations.sort(
      (a: any, b: any) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime(),
    );
  }

  async findOrCreateDirectConversation(userId: string, targetUserId: string) {
    const supabase = this.supabaseService.getClient();

    // Find existing direct conversation between two users
    const { data: existing } = await supabase.rpc("find_direct_conversation", {
      user1_id: userId,
      user2_id: targetUserId,
    });

    if (existing && existing.length > 0) {
      return this.getConversationById(existing[0].conversation_id, userId);
    }

    // Create new direct conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({ type: "direct", created_by: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: targetUserId },
    ]);

    const fullConversation = await this.getConversationById(
      conversation.id,
      userId,
    );

    // FIX #3: Notify the target user of the new conversation via WebSocket
    // AND join both users' sockets to the new conversation room
    this.chatGateway.joinUserToConversation(userId, conversation.id);
    this.chatGateway.notifyNewConversation(targetUserId, fullConversation);

    return fullConversation;
  }

  async createGroupConversation(
    userId: string,
    name: string,
    participantIds: string[],
    description?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({ type: "group", name, description, created_by: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const allParticipants = [...new Set([userId, ...participantIds])];
    await supabase.from("conversation_participants").insert(
      allParticipants.map((pid) => ({
        conversation_id: conversation.id,
        user_id: pid,
        role: pid === userId ? "admin" : "member",
      })),
    );

    const fullConversation = await this.getConversationById(
      conversation.id,
      userId,
    );

    // FIX #3: Notify all other participants of the new group conversation
    participantIds.forEach((pid) => {
      if (pid !== userId) {
        this.chatGateway.joinUserToConversation(pid, conversation.id);
        this.chatGateway.notifyNewConversation(pid, fullConversation);
      }
    });

    return fullConversation;
  }

  async getConversationById(conversationId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify user is participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participant) throw new ForbiddenException("Not a participant");

    const { data } = await supabase
      .from("conversations")
      .select(
        `
        id, type, name, avatar_url, description, last_message_at, created_at,
        last_message:last_message_id(id, content, type, sender_id, created_at),
        participants:conversation_participants(
          user:user_id(id, username, full_name, avatar_url, status, last_seen),
          role, last_read_at
        )
      `,
      )
      .eq("id", conversationId)
      .single();

    return data;
  }

  async markAsRead(conversationId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    return { success: true };
  }
}
