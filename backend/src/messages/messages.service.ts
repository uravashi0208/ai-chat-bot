import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MessagesService {
  constructor(private supabaseService: SupabaseService) {}

  async getMessages(conversationId: string, userId: string, limit = 50, before?: string) {
    const supabase = this.supabaseService.getClient();

    // Verify participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();
    if (!participant) throw new ForbiddenException('Not a participant');

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
    if (error) throw new Error(error.message);

    return (data || []).reverse();
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type = 'text',
    options: {
      mediaUrl?: string;
      mediaThumbnail?: string;
      mediaSize?: number;
      mediaDuration?: number;
      replyToId?: string;
      isForwarded?: boolean;
    } = {},
  ) {
    const supabase = this.supabaseService.getClient();

    // Verify participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select()
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();
    if (!participant) throw new ForbiddenException('Not a participant');

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

    if (error) throw new Error(error.message);

    // Update conversation last_message_id and last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        last_message_at: message.created_at,
      })
      .eq('id', conversationId);

    return message;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const supabase = this.supabaseService.getClient();

    const { data: msg } = await supabase
      .from('messages')
      .select()
      .eq('id', messageId)
      .eq('sender_id', userId)
      .single();
    if (!msg) throw new ForbiddenException('Cannot edit this message');

    const { data, error } = await supabase
      .from('messages')
      .update({ content, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteMessage(messageId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: msg } = await supabase
      .from('messages')
      .select()
      .eq('id', messageId)
      .eq('sender_id', userId)
      .single();
    if (!msg) throw new ForbiddenException('Cannot delete this message');

    const { data } = await supabase
      .from('messages')
      .update({ is_deleted: true, content: null, type: 'deleted' })
      .eq('id', messageId)
      .select()
      .single();
    return data;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('message_reactions')
      .upsert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const supabase = this.supabaseService.getClient();
    await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);
    return { success: true };
  }

  async updateMessageStatus(conversationId: string, userId: string, status: 'delivered' | 'read') {
    const supabase = this.supabaseService.getClient();
    // Get all messages in conversation not sent by this user
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);

    if (!messages || messages.length === 0) return;

    const records = messages.map((m) => ({
      message_id: m.id,
      user_id: userId,
      status,
    }));

    await supabase.from('message_status').upsert(records);
  }
}
