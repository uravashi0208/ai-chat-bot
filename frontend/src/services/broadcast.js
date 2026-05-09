/**
 * @file src/services/broadcast.js
 * @description Broadcast list management and one-to-many messaging.
 *
 * A broadcast list is a saved audience. Sending a broadcast fans out
 * individual direct messages to each recipient — they receive it as a
 * normal DM and never know it was sent to multiple people.
 *
 * Fix: resolver was calling getList() but the method was named getListById().
 * Renamed to getList() throughout for consistency with the resolver.
 */

import { supabase } from "../config/supabase.js";
import { conversationsService } from "./conversations.js";
import { messagesService } from "./messages.js";

// ─── Shared select fragment ───────────────────────────────────────────────────

const LIST_FIELDS = `
  id, name, created_at, updated_at,
  members:broadcast_list_members(
    user:user_id(id, username, full_name, avatar_url, status)
  )
`;

function shapeList(raw) {
  return {
    ...raw,
    recipient_count: raw.members?.length ?? 0,
    recipients: (raw.members ?? []).map((m) => m.user),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const broadcastService = {
  async getLists(userId) {
    const { data, error } = await supabase
      .from("broadcast_lists")
      .select(LIST_FIELDS)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(shapeList);
  },

  /**
   * Fetch a single list. Throws if it does not belong to userId.
   * Named getList() to match the resolver call.
   */
  async getList(listId, userId) {
    const { data, error } = await supabase
      .from("broadcast_lists")
      .select(LIST_FIELDS)
      .eq("id", listId)
      .eq("owner_id", userId)
      .single();
    if (error || !data) throw new Error("Broadcast list not found.");
    return shapeList(data);
  },

  async createList(userId, name, recipientIds) {
    const { data: list, error } = await supabase
      .from("broadcast_lists")
      .insert({ owner_id: userId, name })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const uniqueIds = [...new Set(recipientIds)].filter((id) => id !== userId);
    if (uniqueIds.length > 0) {
      const { error: membersError } = await supabase
        .from("broadcast_list_members")
        .insert(uniqueIds.map((uid) => ({ broadcast_list_id: list.id, user_id: uid })));
      if (membersError) throw new Error(membersError.message);
    }

    return this.getList(list.id, userId);
  },

  async updateList(listId, userId, name) {
    const { data, error } = await supabase
      .from("broadcast_lists")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", listId)
      .eq("owner_id", userId)
      .select()
      .single();
    if (error || !data) throw new Error("Broadcast list not found.");
    return this.getList(listId, userId);
  },

  async deleteList(listId, userId) {
    // broadcast_list_members rows cascade-delete via FK ON DELETE CASCADE
    const { error } = await supabase
      .from("broadcast_lists")
      .delete()
      .eq("id", listId)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async addRecipients(listId, userId, recipientIds) {
    const { data: list } = await supabase
      .from("broadcast_lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", userId)
      .single();
    if (!list) throw new Error("Broadcast list not found or not owned by you.");

    // Unique constraint (broadcast_list_id, user_id) makes this idempotent
    const { error } = await supabase
      .from("broadcast_list_members")
      .upsert(
        recipientIds.map((uid) => ({ broadcast_list_id: listId, user_id: uid })),
        { onConflict: "broadcast_list_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return this.getList(listId, userId);
  },

  async removeRecipient(listId, userId, recipientId) {
    const { data: list } = await supabase
      .from("broadcast_lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", userId)
      .single();
    if (!list) throw new Error("Broadcast list not found or not owned by you.");

    await supabase
      .from("broadcast_list_members")
      .delete()
      .eq("broadcast_list_id", listId)
      .eq("user_id", recipientId);
    return true;
  },

  /**
   * Fan-out a message to every recipient in the list as individual DMs.
   * Failed deliveries are recorded but do not abort the rest.
   */
  async sendBroadcast(listId, senderId, content, type = "text") {
    const { data: list, error } = await supabase
      .from("broadcast_lists")
      .select("id, name, members:broadcast_list_members(user_id)")
      .eq("id", listId)
      .eq("owner_id", senderId)
      .single();
    if (error || !list) throw new Error("Broadcast list not found.");

    const recipientIds = (list.members ?? []).map((m) => m.user_id);
    if (recipientIds.length === 0) return { sent: 0, failed: 0, total: 0, results: [] };

    const settled = await Promise.allSettled(
      recipientIds.map(async (recipientId) => {
        const conversation = await conversationsService.findOrCreateDirectConversation(
          senderId,
          recipientId,
        );
        const message = await messagesService.sendMessage(
          conversation.id,
          senderId,
          content,
          type,
        );
        return { recipientId, conversationId: conversation.id, messageId: message.id, success: true };
      }),
    );

    const results = settled.map((s, i) =>
      s.status === "fulfilled"
        ? s.value
        : { recipientId: recipientIds[i], success: false, error: s.reason?.message ?? "Unknown error" },
    );

    return {
      sent:   results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total:  recipientIds.length,
      results,
    };
  },
};
