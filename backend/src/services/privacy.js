/**
 * @file src/services/privacy.js
 * @description Privacy settings management and field-level visibility enforcement.
 *
 * WhatsApp-style privacy model:
 *   - Each field (last_seen, about, profile_photo, status) has its own
 *     visibility setting: 'Everyone' | 'My contacts' | 'Nobody'
 *   - Block relationships are bidirectional: if either side blocks the other,
 *     all sensitive fields are hidden regardless of privacy settings.
 *   - `applyPrivacyFilter` is the single enforcement point — call it whenever
 *     a user object is returned to a different user.
 */

import { supabase } from "../config/supabase.js";
import { nowISO } from "../utils/helpers.js";

// ─── Allowed values ───────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  "last_seen",
  "profile_photo",
  "about",
  "status",
  "read_receipts",
  "disappearing_messages",
  "groups",
  "silence_unknown_callers",
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const privacyService = {
  /**
   * Get the privacy settings row for a user.
   * Auto-creates a defaults row if none exists (lazy initialisation).
   *
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getPrivacySettings(userId) {
    const { data } = await supabase
      .from("privacy_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) return data;

    // First-time: materialise default settings
    const { data: created, error } = await supabase
      .from("privacy_settings")
      .upsert({ user_id: userId })
      .select("*")
      .single();
    if (error) throw new Error("Failed to initialise privacy settings.");
    return created;
  },

  /**
   * Update one or more privacy settings for a user.
   * Unknown keys are silently ignored (allowlist enforced).
   *
   * @param {string}               userId
   * @param {Record<string,unknown>} updates - Already snake_cased
   * @returns {Promise<object>}
   */
  async updatePrivacySettings(userId, updates) {
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([k]) => UPDATABLE_FIELDS.includes(k)),
    );

    const { data, error } = await supabase
      .from("privacy_settings")
      .upsert(
        { user_id: userId, ...payload, updated_at: nowISO() },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ─── Block management ──────────────────────────────────────────────────────

  /**
   * Get all contacts the user has blocked, ordered most-recently-blocked first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getBlockedContacts(userId) {
    const { data, error } = await supabase
      .from("contacts")
      .select(
        `
        id, blocked_at, block_reason, created_at,
        contact:contact_id(id, username, full_name, avatar_url, about, status, last_seen)
      `,
      )
      .eq("user_id", userId)
      .eq("is_blocked", true)
      .order("blocked_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({ ...row, is_blocked: true }));
  },

  /**
   * Block a contact. Uses upsert so repeated calls are idempotent.
   *
   * @param {string}      userId
   * @param {string}      contactId
   * @param {string|null} reason
   * @returns {Promise<object>}
   */
  async blockContact(userId, contactId, reason) {
    const { data, error } = await supabase
      .from("contacts")
      .upsert({
        user_id: userId,
        contact_id: contactId,
        is_blocked: true,
        blocked_at: nowISO(),
        block_reason: reason ?? null,
      })
      .select(
        `
        id, is_blocked, blocked_at, block_reason, created_at,
        contact:contact_id(id, username, full_name, avatar_url, about, status, last_seen)
      `,
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Unblock a contact.
   * @param {string} userId
   * @param {string} contactId
   * @returns {Promise<true>}
   */
  async unblockContact(userId, contactId) {
    const { error } = await supabase
      .from("contacts")
      .update({ is_blocked: false, blocked_at: null, block_reason: null })
      .eq("user_id", userId)
      .eq("contact_id", contactId);
    if (error) throw new Error(error.message);
    return true;
  },

  // ─── Visibility checks ─────────────────────────────────────────────────────

  /**
   * Determine whether `viewerId` is permitted to see a specific privacy-
   * controlled field on `targetId`'s profile.
   *
   * @param {string} viewerId
   * @param {string} targetId
   * @param {string} field    - e.g. 'last_seen', 'about', 'profile_photo'
   * @returns {Promise<boolean>}
   */
  async canViewField(viewerId, targetId, field) {
    if (viewerId === targetId) return true;

    const settings = await this.getPrivacySettings(targetId);
    const setting = settings[field];

    if (setting === "Everyone") return true;
    if (setting === "Nobody") return false;

    // 'My contacts' — viewer must be in target's contact list (not blocked)
    if (setting === "My contacts" || setting === "My contacts except...") {
      const { data } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", targetId)
        .eq("contact_id", viewerId)
        .eq("is_blocked", false)
        .single();
      return !!data;
    }

    return false;
  },

  /**
   * Apply privacy and block rules to a user object before returning it
   * to a different viewer. Sensitive fields are nulled out when the viewer
   * has no permission to see them.
   *
   * This is the canonical place to enforce privacy — call it on every user
   * object that crosses an API boundary to a different principal.
   *
   * @param {object} targetUser - Full user record from DB
   * @param {string} viewerId
   * @returns {Promise<object>}
   */
  async applyPrivacyFilter(targetUser, viewerId) {
    // Owner always sees their own full profile
    if (!targetUser || targetUser.id === viewerId) return targetUser;

    // Check for blocks in either direction
    const [{ data: blockedByTarget }, { data: blockedByViewer }] =
      await Promise.all([
        supabase
          .from("contacts")
          .select("id")
          .eq("user_id", targetUser.id)
          .eq("contact_id", viewerId)
          .eq("is_blocked", true)
          .maybeSingle(),
        supabase
          .from("contacts")
          .select("id")
          .eq("user_id", viewerId)
          .eq("contact_id", targetUser.id)
          .eq("is_blocked", true)
          .maybeSingle(),
      ]);

    if (blockedByTarget || blockedByViewer) {
      return {
        ...targetUser,
        last_seen: null,
        status: null,
        about: null,
        avatar_url: null,
      };
    }

    // Parallel field-level checks for best performance
    const [canSeeLastSeen, canSeeAbout, canSeeStatus, canSeePhoto] =
      await Promise.all([
        this.canViewField(viewerId, targetUser.id, "last_seen"),
        this.canViewField(viewerId, targetUser.id, "about"),
        this.canViewField(viewerId, targetUser.id, "status"),
        this.canViewField(viewerId, targetUser.id, "profile_photo"),
      ]);

    return {
      ...targetUser,
      last_seen: canSeeLastSeen ? targetUser.last_seen : null,
      about: canSeeAbout ? targetUser.about : null,
      status: canSeeStatus ? targetUser.status : null,
      avatar_url: canSeePhoto ? targetUser.avatar_url : null,
    };
  },
};
