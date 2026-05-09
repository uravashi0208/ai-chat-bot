/**
 * @file src/services/userPrefs.js
 * @description User preferences (theme, wallpaper, font, etc.).
 *
 * Preferences are lazily initialised — if no row exists for the user,
 * `DEFAULT_PREFS` is upserted and returned so callers never see a null.
 */

import { supabase } from "../config/supabase.js";
import { pickAllowed, nowISO } from "../utils/helpers.js";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFS = Object.freeze({
  theme: "light",
  wallpaper: "default",
  chat_color: "purple",
  font_size: "medium",
  enter_is_send: true,
  archive_keep: true,
  backup_freq: "Off",
  last_backup_at: null,
  media_auto_download: true,
  show_read_receipts: true,
  notifications_enabled: true,
});

const UPDATABLE_FIELDS = [
  "theme",
  "wallpaper",
  "chat_color",
  "font_size",
  "enter_is_send",
  "archive_keep",
  "backup_freq",
  "last_backup_at",
  "ai_wallpaper_url",
  "media_auto_download",
  "show_read_receipts",
  "notifications_enabled",
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const userPrefsService = {
  /**
   * Get preferences for a user. Auto-creates defaults on first access.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getPreferences(userId) {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) return data;

    // Lazy initialisation
    const { data: created, error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...DEFAULT_PREFS }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error("Failed to initialise user preferences.");
    return created;
  },

  /**
   * Update one or more preferences. Unknown fields are silently ignored.
   * @param {string}               userId
   * @param {Record<string,unknown>} updates - Already snake_cased
   * @returns {Promise<object>}
   */
  async updatePreferences(userId, updates) {
    const payload = pickAllowed(updates, UPDATABLE_FIELDS);

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, ...payload, updated_at: nowISO() },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
