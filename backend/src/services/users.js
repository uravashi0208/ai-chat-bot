/**
 * @file src/services/users.js
 * @description User profile, contacts, security settings, and account lifecycle.
 *
 * All methods enforce ownership — a user can only mutate their own data.
 * Cascade deletions in `deleteAccount` maintain referential integrity for
 * tables that lack ON DELETE CASCADE in the DB schema.
 */

import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { pickAllowed, nowISO } from "../utils/helpers.js";

const BCRYPT_ROUNDS = 12;
const PIN_ROUNDS = 10;

// ─── Field selects (reused across queries) ────────────────────────────────────

const PUBLIC_FIELDS =
  "id, username, full_name, avatar_url, about, status, last_seen";
const PROFILE_FIELDS = `id, username, full_name, email, phone, avatar_url, about, status,
                          last_seen, created_at, two_step_enabled`;
const CONTACT_FIELDS = `id, nickname, is_blocked, created_at,
                          contact:contact_id(${PUBLIC_FIELDS})`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const usersService = {
  /**
   * Find a user by primary key. Throws if not found.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from("users")
      .select(PROFILE_FIELDS)
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("User not found.");
    return data;
  },

  /**
   * Full-text search across username and display name.
   * Excludes the requesting user from results.
   *
   * @param {string} query
   * @param {string} currentUserId
   * @returns {Promise<object[]>}
   */
  async searchUsers(query, currentUserId) {
    const { data } = await supabase
      .from("users")
      .select(PUBLIC_FIELDS)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(20);
    return data ?? [];
  },

  /**
   * Partial profile update. Only fields in the allowlist can be changed.
   * @param {string} userId
   * @param {Record<string, unknown>} updates
   * @returns {Promise<object>}
   */
  async updateProfile(userId, updates) {
    const UPDATABLE = ["full_name", "about", "avatar_url", "phone"];
    const payload = pickAllowed(updates, UPDATABLE);

    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select(
        `id, username, full_name, email, phone, avatar_url, about, status, two_step_enabled`,
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update presence status and record `last_seen` timestamp.
   * @param {string} userId
   * @param {'online'|'offline'} status
   */
  async updateStatus(userId, status) {
    await supabase
      .from("users")
      .update({ status, last_seen: nowISO() })
      .eq("id", userId);
  },

  /**
   * Retrieve a user's non-blocked contact list.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getContacts(userId) {
    const { data } = await supabase
      .from("contacts")
      .select(CONTACT_FIELDS)
      .eq("user_id", userId)
      .eq("is_blocked", false);
    return data ?? [];
  },

  /**
   * Add or update a contact (upsert on user_id + contact_id).
   * @param {string}      userId
   * @param {string}      contactId
   * @param {string|null} nickname
   * @returns {Promise<object>}
   */
  async addContact(userId, contactId, nickname) {
    const { data, error } = await supabase
      .from("contacts")
      .upsert({ user_id: userId, contact_id: contactId, nickname })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ─── Security: password ────────────────────────────────────────────────────

  /**
   * Change the user's password after verifying the current one.
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<true>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();
    if (!user) throw new Error("User not found.");

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error("Current password is incorrect.");

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await supabase
      .from("users")
      .update({ password_hash: hash })
      .eq("id", userId);
    return true;
  },

  // ─── Security: two-step PIN ────────────────────────────────────────────────

  /**
   * Enable two-step verification with a 6-digit PIN.
   * @param {string} userId
   * @param {string} pin - Exactly 6 digits
   * @returns {Promise<true>}
   */
  async enableTwoStep(userId, pin) {
    if (!pin || !/^\d{6}$/.test(pin)) {
      throw new Error("PIN must be exactly 6 digits.");
    }
    const pinHash = await bcrypt.hash(pin, PIN_ROUNDS);
    const { error } = await supabase
      .from("users")
      .update({
        two_step_enabled: true,
        two_step_pin_hash: pinHash,
        two_step_enabled_at: nowISO(),
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  /**
   * Disable two-step verification. Requires the current PIN.
   * @param {string} userId
   * @param {string} pin
   * @returns {Promise<true>}
   */
  async disableTwoStep(userId, pin) {
    const { data: user } = await supabase
      .from("users")
      .select("two_step_pin_hash, two_step_enabled")
      .eq("id", userId)
      .single();
    if (!user?.two_step_enabled)
      throw new Error("Two-step verification is not enabled.");

    const isValid = await bcrypt.compare(pin, user.two_step_pin_hash);
    if (!isValid) throw new Error("Incorrect PIN.");

    await supabase
      .from("users")
      .update({
        two_step_enabled: false,
        two_step_pin_hash: null,
        two_step_enabled_at: null,
      })
      .eq("id", userId);
    return true;
  },

  /**
   * Change the two-step PIN. Requires current PIN to authorise.
   * @param {string} userId
   * @param {string} currentPin
   * @param {string} newPin
   * @returns {Promise<true>}
   */
  async changeTwoStepPin(userId, currentPin, newPin) {
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      throw new Error("New PIN must be exactly 6 digits.");
    }
    const { data: user } = await supabase
      .from("users")
      .select("two_step_pin_hash, two_step_enabled")
      .eq("id", userId)
      .single();
    if (!user?.two_step_enabled)
      throw new Error("Two-step verification is not enabled.");

    const isValid = await bcrypt.compare(currentPin, user.two_step_pin_hash);
    if (!isValid) throw new Error("Current PIN is incorrect.");

    const newHash = await bcrypt.hash(newPin, PIN_ROUNDS);
    await supabase
      .from("users")
      .update({ two_step_pin_hash: newHash })
      .eq("id", userId);
    return true;
  },

  // ─── Account deletion ──────────────────────────────────────────────────────

  /**
   * Permanently delete the account and all associated data.
   * Tables without ON DELETE CASCADE are cleaned up manually here.
   *
   * @param {string} userId
   * @param {string} password - Must match the stored hash
   * @returns {Promise<true>}
   */
  async deleteAccount(userId, password) {
    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();
    if (!user) throw new Error("User not found.");

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error("Incorrect password.");

    // Cascade cleanup in dependency order
    const cleanupSteps = [
      supabase.from("broadcast_list_members").delete().eq("user_id", userId),
      supabase.from("broadcast_lists").delete().eq("owner_id", userId),
      supabase.from("message_reactions").delete().eq("user_id", userId),
      supabase.from("starred_messages").delete().eq("user_id", userId),
      supabase.from("message_status").delete().eq("user_id", userId),
      supabase.from("messages").delete().eq("sender_id", userId),
      supabase.from("conversation_participants").delete().eq("user_id", userId),
      supabase.from("contacts").delete().eq("user_id", userId),
      supabase.from("contacts").delete().eq("contact_id", userId),
    ];

    await Promise.all(cleanupSteps);
    await supabase.from("users").delete().eq("id", userId);
    return true;
  },
};
