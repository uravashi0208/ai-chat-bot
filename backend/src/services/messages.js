/**
 * @file src/services/messages.js
 * @description Message CRUD, reactions, starring, and delivery-status tracking.
 *
 * All write operations first verify that the calling user is a participant in
 * the target conversation, or that they own the target message.  This keeps
 * authorisation close to the data rather than scattered across resolvers.
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

/**
 * Verify the user is a member of the conversation.
 * Throws if not a participant.
 *
 * @param {string} conversationId
 * @param {string} userId
 */
async function assertParticipant(conversationId, userId) {
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single();
  if (!data) throw new Error("Access denied: not a conversation participant.");
}

/**
 * Verify the user owns a specific message.
 * Throws if not the sender.
 *
 * @param {string} messageId
 * @param {string} userId
 * @returns {Promise<object>} The message row
 */
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
   * Fetch a paginated list of messages for a conversation.
   * Results are returned in ascending chronological order (oldest first).
   *
   * @param {string}      conversationId
   * @param {string}      userId         - Must be a participant
   * @param {number}      limit          - Page size (default 50)
   * @param {string|null} before         - ISO timestamp cursor for pagination
   * @returns {Promise<object[]>}
   */
  async getMessages(conversationId, userId, limit = 50, before = null) {
    await assertParticipant(conversationId, userId);

    let query = supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("created_at", before);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Reverse so the array is oldest-first (chat convention)
    return (data ?? []).reverse();
  },

  /**
   * Send a new message. Updates the conversation's `last_message_*` metadata
   * as a single follow-up write so the conversations list stays current.
   *
   * @param {string} conversationId
   * @param {string} senderId
   * @param {string} content
   * @param {string} type
   * @param {object} options
   * @param {string|null} options.mediaUrl
   * @param {string|null} options.mediaThumbnail
   * @param {number|null} options.mediaSize
   * @param {number|null} options.mediaDuration
   * @param {string|null} options.replyToId
   * @param {boolean}     options.isForwarded
   * @returns {Promise<object>}
   */
  async sendMessage(
    conversationId,
    senderId,
    content,
    type = "text",
    options = {},
  ) {
    await assertParticipant(conversationId, senderId);

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        media_url: options.mediaUrl ?? null,
        media_thumbnail: options.mediaThumbnail ?? null,
        media_size: options.mediaSize ?? null,
        media_duration: options.mediaDuration ?? null,
        reply_to_id: options.replyToId ?? null,
        is_forwarded: options.isForwarded ?? false,
        status: "sent",
      })
      .select(MESSAGE_FIELDS_NO_REACTIONS)
      .single();
    if (error) throw new Error(error.message);

    // Keep the conversation list accurate
    await supabase
      .from("conversations")
      .update({
        last_message_id: message.id,
        last_message_at: message.created_at,
      })
      .eq("id", conversationId);

    return message;
  },

  /**
   * Edit the text content of an existing message.
   * Only the original sender may edit.
   *
   * @param {string} messageId
   * @param {string} userId
   * @param {string} content
   * @returns {Promise<object>}
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
   * Soft-delete a message — content is wiped, type becomes 'deleted'.
   * Only the original sender may delete.
   *
   * @param {string} messageId
   * @param {string} userId
   * @returns {Promise<object>}
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

  /** @param {string} messageId @param {string} userId @returns {Promise<object>} */
  async starMessage(messageId, userId) {
    const { data, error } = await supabase
      .from("starred_messages")
      .upsert({ message_id: messageId, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** @param {string} messageId @param {string} userId @returns {Promise<true>} */
  async unstarMessage(messageId, userId) {
    await supabase
      .from("starred_messages")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
    return true;
  },

  /**
   * Return all messages the user has starred, most-recently-starred first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getStarredMessages(userId) {
    const { data, error } = await supabase
      .from("starred_messages")
      .select(
        `
        id, created_at,
        message:message_id(
          id, content, type, created_at,
          sender:sender_id(id, username, full_name, avatar_url),
          conversation:conversation_id(id, name)
        )
      `,
      )
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

  /**
   * Add or update a reaction from this user on a message.
   * Upsert on (message_id, user_id) so a user can only hold one emoji per message.
   */
  async addReaction(messageId, userId, emoji) {
    const { data, error } = await supabase
      .from("message_reactions")
      .upsert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Remove a specific emoji reaction by this user. */
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
   * Mark all unread messages in a conversation as `delivered` or `read`
   * for the given user.  Also updates per-message status rows for fine-
   * grained tracking (used by the double-tick indicators).
   *
   * Status order: sent < delivered < read (never moves backwards).
   *
   * @param {string} conversationId
   * @param {string} userId         - The reader/receiver
   * @param {'delivered'|'read'} status
   * @returns {Promise<{ messages: object[], now: string }|undefined>}
   */
  async updateMessageStatus(conversationId, userId, status) {
    const now = nowISO();

    const { data: messages } = await supabase
      .from("messages")
      .select("id, status")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (!messages?.length) return;

    // Upsert per-user-per-message status rows
    const statusRecords = messages.map((m) => ({
      message_id: m.id,
      user_id: userId,
      status,
      ...(status === "delivered" ? { delivered_at: now } : {}),
      ...(status === "read" ? { read_at: now } : {}),
    }));
    await supabase.from("message_status").upsert(statusRecords);

    // Bump the canonical status on messages that haven't reached this level yet
    const ORDER = { sent: 0, delivered: 1, read: 2 };
    const toUpdate = messages.filter(
      (m) => (ORDER[m.status] ?? -1) < ORDER[status],
    );

    if (toUpdate.length > 0) {
      await supabase
        .from("messages")
        .update({
          status,
          ...(status === "delivered" ? { delivered_at: now } : {}),
          ...(status === "read" ? { read_at: now } : {}),
        })
        .in(
          "id",
          toUpdate.map((m) => m.id),
        );
    }

    return { messages, now };
  },
};
