/**
 * @file src/services/status.js
 * @description WhatsApp-style status stories (24-hour ephemeral posts).
 *
 * Statuses expire automatically after 24 hours — the DB column `expires_at`
 * is used as a filter in all read queries so no cron job is needed.
 * View tracking is upserted so duplicate views are safely ignored.
 */

import { supabase } from "../config/supabase.js";
import { futureISO } from "../utils/helpers.js";

const STATUS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const STATUS_FIELDS = `
  id, type, content, media_url, bg_color, expires_at, created_at,
  user:user_id(id, username, full_name, avatar_url)
`;

export const statusService = {
  /**
   * Post a new status update.
   * The `expires_at` is always set to 24 hours from now.
   *
   * @param {string} userId
   * @param {{ type: string, content?: string, mediaUrl?: string, bgColor?: string }} opts
   * @returns {Promise<object>}
   */
  async createStatus(userId, { type, content, mediaUrl, bgColor }) {
    const { data, error } = await supabase
      .from("user_statuses")
      .insert({
        user_id: userId,
        type: type ?? "text",
        content: content ?? null,
        media_url: mediaUrl ?? null,
        bg_color: bgColor ?? "#075E54",
        expires_at: futureISO(STATUS_TTL_MS),
      })
      .select(STATUS_FIELDS)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Return the calling user's own non-expired statuses, newest first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getMyStatuses(userId) {
    const { data, error } = await supabase
      .from("user_statuses")
      .select(STATUS_FIELDS)
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Return non-expired statuses from the user's contacts (plus their own).
   * The resolver groups these into per-user `StatusGroup` objects.
   *
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getStatusFeed(userId) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("contact_id")
      .eq("user_id", userId)
      .eq("is_blocked", false);

    const contactIds = (contacts ?? []).map((c) => c.contact_id);
    const feedIds = [...new Set([userId, ...contactIds])];

    const { data, error } = await supabase
      .from("user_statuses")
      .select(STATUS_FIELDS)
      .in("user_id", feedIds)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Record that a user viewed a status (idempotent — safe to call multiple times).
   * @param {string} statusId
   * @param {string} viewerId
   * @returns {Promise<true>}
   */
  async markViewed(statusId, viewerId) {
    await supabase
      .from("status_views")
      .upsert({ status_id: statusId, viewer_id: viewerId })
      .select();
    return true;
  },

  /**
   * Get all viewers of a status. Only the owner of the status may call this.
   * @param {string} statusId
   * @param {string} requesterId
   * @returns {Promise<object[]>}
   */
  async getStatusViewers(statusId, requesterId) {
    const { data: status } = await supabase
      .from("user_statuses")
      .select("user_id")
      .eq("id", statusId)
      .single();
    if (!status || status.user_id !== requesterId)
      throw new Error("Not authorized.");

    const { data, error } = await supabase
      .from("status_views")
      .select(
        "viewer_id, viewed_at, viewer:viewer_id(id, username, full_name, avatar_url)",
      )
      .eq("status_id", statusId)
      .order("viewed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Delete a status. Only the owner may delete.
   * @param {string} statusId
   * @param {string} userId
   * @returns {Promise<true>}
   */
  async deleteStatus(statusId, userId) {
    const { error } = await supabase
      .from("user_statuses")
      .delete()
      .eq("id", statusId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  /**
   * Given a list of status IDs, return the subset that the viewer has already seen.
   * Used by the resolver to compute the `has_unseen` flag on each `StatusGroup`.
   *
   * @param {string}   viewerId
   * @param {string[]} statusIds
   * @returns {Promise<string[]>}
   */
  async getViewedStatusIds(viewerId, statusIds) {
    if (!statusIds?.length) return [];
    const { data } = await supabase
      .from("status_views")
      .select("status_id")
      .eq("viewer_id", viewerId)
      .in("status_id", statusIds);
    return (data ?? []).map((v) => v.status_id);
  },
};
