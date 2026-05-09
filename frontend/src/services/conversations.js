/**
 * @file src/services/conversations.js
 * @description Conversation management — direct, group, and conversation metadata.
 *
 * The `_chatGateway` dependency is injected at startup (not imported directly)
 * to avoid a circular module dependency between the service layer and the
 * WebSocket gateway.  Call `setChatGateway` once during server bootstrap.
 */

import { supabase } from "../config/supabase.js";
import { privacyService } from "./privacy.js";
import { nowISO } from "../utils/helpers.js";

// ─── Gateway injection ────────────────────────────────────────────────────────

/** @type {import('../chat/gateway.js').ChatGateway|null} */
let _chatGateway = null;

/**
 * Inject the Socket.IO gateway. Must be called once during server bootstrap,
 * after both the HTTP server and socket gateway have been initialised.
 * @param {import('../chat/gateway.js').ChatGateway} gateway
 */
export function setChatGateway(gateway) {
  _chatGateway = gateway;
}

// ─── Shared select fragments ──────────────────────────────────────────────────

const PARTICIPANT_FIELDS = `
  user:user_id(id, username, full_name, avatar_url, status, last_seen),
  role, last_read_at
`;

const CONVERSATION_CORE = `
  id, type, name, avatar_url, description, last_message_at, created_at, last_message_id,
  participants:conversation_participants(${PARTICIPANT_FIELDS})
`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const conversationsService = {
  /**
   * Return all non-archived conversations for a user, enriched with:
   *   - last message preview
   *   - unread count
   *   - mute / archive flags
   *
   * Sorted most-recently-active first.
   *
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getUserConversations(userId) {
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select(
        `
        conversation_id, last_read_at, is_muted, is_archived, is_pinned, is_favourite, disappearing_messages, cleared_at,
        conversation:conversations(${CONVERSATION_CORE})
      `,
      )
      .eq("user_id", userId)
      .eq("is_archived", false);

    const conversations = (participations ?? []).map((p) => ({
      ...p.conversation,
      last_read_at: p.last_read_at,
      is_muted: p.is_muted,
      is_archived: p.is_archived,
      is_pinned: p.is_pinned,
      is_favourite: p.is_favourite,
      disappearing_messages: p.disappearing_messages,
      cleared_at: p.cleared_at ?? null,
    }));

    // Batch-fetch last messages
    const lastMsgIds = conversations
      .filter((c) => c.last_message_id)
      .map((c) => c.last_message_id);
    const lastMsgMap = {};
    if (lastMsgIds.length > 0) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, type, sender_id, created_at")
        .in("id", lastMsgIds);
      (msgs ?? []).forEach((m) => {
        lastMsgMap[m.id] = m;
      });
    }

    // Batch-fetch unread counts
    const convIds = conversations.map((c) => c.id);
    const unreadMap = {};
    if (convIds.length > 0) {
      const { data: unread } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .neq("sender_id", userId)
        .neq("type", "deleted")
        .not(
          "id",
          "in",
          supabase
            .from("message_status")
            .select("message_id")
            .eq("user_id", userId)
            .eq("status", "read"),
        );
      (unread ?? []).forEach((row) => {
        unreadMap[row.conversation_id] =
          (unreadMap[row.conversation_id] ?? 0) + 1;
      });
    }

    // Apply per-participant privacy filters so that blocked users'
    // avatar_url / last_seen / status are nulled out for the viewer.
    // This mirrors what getConversationById already does, ensuring the
    // sidebar list is also privacy-safe.
    const enrichedRaw = conversations.map((c) => {
      // If the user cleared this chat, hide any last_message that predates cleared_at
      const lastMsg = lastMsgMap[c.last_message_id] ?? null;
      const visibleLastMsg =
        lastMsg && c.cleared_at && lastMsg.created_at <= c.cleared_at
          ? null
          : lastMsg;
      return {
        ...c,
        last_message: visibleLastMsg,
        unread_count: unreadMap[c.id] ?? 0,
      };
    });

    const enriched = await Promise.all(
      enrichedRaw.map(async (c) => {
        const filteredParticipants = await Promise.all(
          (c.participants ?? []).map(async (p) => {
            if (!p.user || p.user.id === userId) return p;
            const filteredUser = await privacyService.applyPrivacyFilter(
              p.user,
              userId,
            );
            return { ...p, user: filteredUser };
          }),
        );
        return { ...c, participants: filteredParticipants };
      }),
    );

    return enriched.sort(
      (a, b) =>
        new Date(b.last_message_at ?? b.created_at) -
        new Date(a.last_message_at ?? a.created_at),
    );
  },

  /**
   * Find an existing direct conversation between two users, or create one.
   * Uses an RPC for the lookup and falls back to a manual set-intersection
   * if the RPC is unavailable.
   *
   * @param {string} userId
   * @param {string} targetUserId
   * @returns {Promise<object>}
   */
  async findOrCreateDirectConversation(userId, targetUserId) {
    // Attempt DB-side lookup via stored procedure (most efficient path)
    try {
      const { data } = await supabase.rpc("find_direct_conversation", {
        user1_id: userId,
        user2_id: targetUserId,
      });
      if (data?.length > 0) {
        return this.getConversationById(data[0].conversation_id, userId);
      }
    } catch {
      // RPC not available — fall through to manual lookup
    }

    // Manual set-intersection: find a conversation both users share of type 'direct'
    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, conversation:conversations(id, type)")
        .eq("user_id", userId),
      supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId),
    ]);

    const sharedIds = new Set((p2 ?? []).map((p) => p.conversation_id));
    const existing = (p1 ?? []).find(
      (p) =>
        sharedIds.has(p.conversation_id) && p.conversation?.type === "direct",
    );
    if (existing)
      return this.getConversationById(existing.conversation_id, userId);

    // Create a brand-new direct conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({ type: "direct", created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: targetUserId },
    ]);

    const full = await this.getConversationById(conversation.id, userId);

    // Real-time: notify the other user and join both to the socket room
    if (_chatGateway) {
      _chatGateway.joinUserToConversation(userId, conversation.id);
      _chatGateway.notifyNewConversation(targetUserId, full);
    }

    return full;
  },

  /**
   * Create a group conversation.
   * The creator is automatically added as admin.
   *
   * @param {string}   userId
   * @param {string}   name
   * @param {string[]} participantIds
   * @param {string|null} description
   * @returns {Promise<object>}
   */
  async createGroupConversation(userId, name, participantIds, description) {
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({ type: "group", name, description, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const allMembers = [...new Set([userId, ...participantIds])];
    await supabase.from("conversation_participants").insert(
      allMembers.map((pid) => ({
        conversation_id: conversation.id,
        user_id: pid,
        role: pid === userId ? "admin" : "member",
      })),
    );

    const full = await this.getConversationById(conversation.id, userId);

    // Real-time: invite participants to the socket room
    if (_chatGateway) {
      participantIds
        .filter((pid) => pid !== userId)
        .forEach((pid) => {
          _chatGateway.joinUserToConversation(pid, conversation.id);
          _chatGateway.notifyNewConversation(pid, full);
        });
    }

    return full;
  },

  /**
   * Fetch a single conversation by ID.
   * Verifies participation, applies privacy filters to participant profiles,
   * and attaches the last message preview.
   *
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async getConversationById(conversationId, userId) {
    const { data: membership } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();
    if (!membership) throw new Error("Access denied: not a participant.");

    const { data } = await supabase
      .from("conversations")
      .select(CONVERSATION_CORE)
      .eq("id", conversationId)
      .single();
    if (!data) return null;

    // Fetch last message
    let last_message = null;
    if (data.last_message_id) {
      const { data: msg } = await supabase
        .from("messages")
        .select("id, content, type, sender_id, created_at")
        .eq("id", data.last_message_id)
        .single();
      last_message = msg ?? null;
    }

    // Apply per-participant privacy filters in parallel
    const filteredParticipants = await Promise.all(
      (data.participants ?? []).map(async (p) => {
        if (!p.user) return p;
        const filteredUser = await privacyService.applyPrivacyFilter(
          p.user,
          userId,
        );
        return { ...p, user: filteredUser };
      }),
    );

    return { ...data, participants: filteredParticipants, last_message };
  },

  /**
   * Update the `last_read_at` timestamp for a user in a conversation.
   * The unread count for this conversation will drop to 0 after this call.
   *
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<true>}
   */
  async markAsRead(conversationId, userId) {
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: nowISO() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    return true;
  },

  // ── New conversation actions ──────────────────────────────────────────────

  async muteConversation(conversationId, userId, mute) {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ is_muted: mute })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async pinConversation(conversationId, userId, pin) {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ is_pinned: pin })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async favouriteConversation(conversationId, userId, favourite) {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ is_favourite: favourite })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async clearChat(conversationId, userId) {
    // Per-user clear: store a "cleared_at" timestamp on the participant row.
    // Messages created BEFORE this timestamp are hidden only for this user.
    // The other participant's view is completely unaffected.
    const { error } = await supabase
      .from("conversation_participants")
      .update({ cleared_at: nowISO() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async deleteConversation(conversationId, userId) {
    // Remove participant — soft leave
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async setDisappearingMessages(conversationId, userId, duration) {
    await supabase
      .from("conversation_participants")
      .update({ disappearing_messages: duration })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
    return true;
  },

  async searchMessages(conversationId, userId, query) {
    await this.getConversationById(conversationId, userId); // access check
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, content, type, media_url, created_at, is_deleted, sender:sender_id(id, username, full_name, avatar_url), reply_to:reply_to_id(id, content, type, sender:sender_id(id, username, full_name, avatar_url))",
      )
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .eq("type", "text")
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
