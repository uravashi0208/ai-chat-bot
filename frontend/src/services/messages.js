/**
 * @file src/services/messages.js
 * @description Message CRUD, reactions, starring, and delivery-status tracking.
 *
 * Delivery tracking uses three fields on the messages row itself:
 *   status: 'sent' | 'delivered' | 'read'
 *   delivered_at / read_at timestamps
 *
 * The separate message_status table has been removed.  For groups, unread
 * counts are derived from conversation_participants.last_read_at per member,
 * which is already updated by markConversationRead / markAsRead.
 */

import { supabase } from "../config/supabase.js";
import { nowISO } from "../utils/helpers.js";

// ─── Shared select fragments ──────────────────────────────────────────────────

const MESSAGE_FIELDS = `
  id, content, type, media_url, media_thumbnail, media_size, media_duration,
  is_deleted, is_forwarded, edited_at, created_at, status, delivered_at, read_at,
  sender:sender_id(id, username, full_name, avatar_url),
  reply_to:reply_to_id(id, content, type, sender:sender_id(id, username, full_name)),
  reactions:message_reactions(id, emoji, user_id)
`;

const MESSAGE_FIELDS_NO_REACTIONS = `
  id, content, type, media_url, media_thumbnail, media_size, media_duration,
  is_deleted, is_forwarded, edited_at, created_at, status, delivered_at, read_at,
  sender:sender_id(id, username, full_name, avatar_url),
  reply_to:reply_to_id(id, content, type, sender:sender_id(id, username, full_name))
`;

// ─── Private helpers ──────────────────────────────────────────────────────────

async function assertParticipant(conversationId, userId) {
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();
  if (!data) throw new Error("Access denied: not a conversation participant.");
}

async function assertMessageOwner(messageId, userId) {
  const { data } = await supabase
    .from("messages")
    .select("id, status")
    .eq("id", messageId)
    .eq("sender_id", userId)
    .single();
  if (!data) throw new Error("Access denied: you do not own this message.");
  return data;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const messagesService = {
  /**
   * Fetch a paginated list of messages for a conversation (oldest-first).
   * Respects the per-user cleared_at so chat-clear is isolated per member.
   */
  async getMessages(conversationId, userId, limit = 50, before = null) {
    await assertParticipant(conversationId, userId);

    const { data: participation } = await supabase
      .from("conversation_participants")
      .select("cleared_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    let query = supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("created_at", before);
    if (participation?.cleared_at) {
      query = query.gt("created_at", participation.cleared_at);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).reverse(); // Return oldest-first
  },

  /**
   * Send a new message and update conversation last_message metadata.
   */
  async sendMessage(conversationId, senderId, content, type = "text", options = {}) {
    await assertParticipant(conversationId, senderId);

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        media_url:       options.mediaUrl       ?? null,
        media_thumbnail: options.mediaThumbnail  ?? null,
        media_size:      options.mediaSize       ?? null,
        media_duration:  options.mediaDuration   ?? null,
        reply_to_id:     options.replyToId       ?? null,
        is_forwarded:    options.isForwarded      ?? false,
        status: "sent",
      })
      .select(MESSAGE_FIELDS_NO_REACTIONS)
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("conversations")
      .update({ last_message_id: message.id, last_message_at: message.created_at })
      .eq("id", conversationId);

    return message;
  },

  /**
   * Edit the text content of an owned message.
   */
  async editMessage(messageId, userId, content) {
    await assertMessageOwner(messageId, userId);

    const { data, error } = await supabase
      .from("messages")
      .update({ content, edited_at: nowISO() })
      .eq("id", messageId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Soft-delete: wipe content and set type='deleted'.
   */
  async deleteMessage(messageId, userId) {
    await assertMessageOwner(messageId, userId);

    const { data } = await supabase
      .from("messages")
      .update({ is_deleted: true, content: null, type: "deleted" })
      .eq("id", messageId)
      .select()
      .single();
    return data;
  },

  // ─── Starring ──────────────────────────────────────────────────────────────

  async starMessage(messageId, userId) {
    const { data, error } = await supabase
      .from("starred_messages")
      .upsert({ message_id: messageId, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async unstarMessage(messageId, userId) {
    await supabase
      .from("starred_messages")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
    return true;
  },

  async getStarredMessages(userId) {
    const { data, error } = await supabase
      .from("starred_messages")
      .select(`
        id, created_at,
        message:message_id(
          id, content, type, created_at,
          sender:sender_id(id, username, full_name, avatar_url),
          conversation:conversation_id(id, name)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((s) => ({
      ...s.message,
      starred_at: s.created_at,
      sender_name: s.message?.sender?.full_name,
    }));
  },

  // ─── Reactions ─────────────────────────────────────────────────────────────
  // Unique constraint (message_id, user_id) on the table makes upsert safe.

  async addReaction(messageId, userId, emoji) {
    const { data, error } = await supabase
      .from("message_reactions")
      .upsert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async removeReaction(messageId, userId, emoji) {
    await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    return true;
  },

  // ─── Delivery status ───────────────────────────────────────────────────────
  /**
   * Advance status of messages sent TO this user in a conversation.
   * Status order: sent < delivered < read (never goes backwards).
   *
   * Called by the Socket.IO gateway when the recipient connects (→ delivered)
   * and when they open the conversation (→ read).
   */
  async updateMessageStatus(conversationId, userId, status) {
    const now = nowISO();
    const ORDER = { sent: 0, delivered: 1, read: 2 };

    const { data: messages } = await supabase
      .from("messages")
      .select("id, status")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (!messages?.length) return;

    const toUpdate = messages.filter(
      (m) => (ORDER[m.status] ?? -1) < ORDER[status],
    );

    if (toUpdate.length > 0) {
      await supabase
        .from("messages")
        .update({
          status,
          ...(status === "delivered" ? { delivered_at: now } : {}),
          ...(status === "read"      ? { read_at: now }       : {}),
        })
        .in("id", toUpdate.map((m) => m.id));
    }

    return { messages, now };
  },
};
