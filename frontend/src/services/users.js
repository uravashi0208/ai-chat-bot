/**
 * @file src/services/users.js
 * @description User profile, contacts, security settings, and account lifecycle.
 *
 * deleteAccount() is now much simpler: because all child tables have
 * ON DELETE CASCADE on their user_id foreign keys, deleting the users row
 * automatically removes all associated data. No manual cleanup steps needed.
 */

import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { pickAllowed, nowISO } from "../utils/helpers.js";

const BCRYPT_ROUNDS = 12;
const PIN_ROUNDS    = 10;

const PUBLIC_FIELDS  = "id, username, full_name, avatar_url, about, status, last_seen";
const PROFILE_FIELDS = `id, username, full_name, email, phone, avatar_url, about, status,
                         last_seen, created_at, two_step_enabled`;
const CONTACT_FIELDS = `id, nickname, is_blocked, created_at,
                         contact:contact_id(${PUBLIC_FIELDS})`;

export const usersService = {
  async findById(id) {
    const { data, error } = await supabase
      .from("users")
      .select(PROFILE_FIELDS)
      .eq("id", id)
      .single();
    if (error || !data) throw new Error("User not found.");
    return data;
  },

  async searchUsers(query, currentUserId) {
    const { data } = await supabase
      .from("users")
      .select(PUBLIC_FIELDS)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(20);
    return data ?? [];
  },

  async updateProfile(userId, updates) {
    const UPDATABLE = ["full_name", "about", "avatar_url", "phone"];
    const payload   = pickAllowed(updates, UPDATABLE);

    const { data, error } = await supabase
      .from("users")
      .update({ ...payload, updated_at: nowISO() })
      .eq("id", userId)
      .select("id, username, full_name, email, phone, avatar_url, about, status, two_step_enabled")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateStatus(userId, status) {
    await supabase
      .from("users")
      .update({ status, last_seen: nowISO(), updated_at: nowISO() })
      .eq("id", userId);
  },

  async getContacts(userId) {
    const { data } = await supabase
      .from("user_contacts")
      .select(CONTACT_FIELDS)
      .eq("user_id", userId)
      .eq("is_blocked", false);
    return data ?? [];
  },

  async addContact(userId, contactId, nickname) {
    // Unique constraint (user_id, contact_id) makes this idempotent
    const { data, error } = await supabase
      .from("user_contacts")
      .upsert(
        { user_id: userId, contact_id: contactId, nickname: nickname ?? null },
        { onConflict: "user_id,contact_id" },
      )
      .select(CONTACT_FIELDS)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateNickname(userId, contactId, nickname) {
    const { data, error } = await supabase
      .from("user_contacts")
      .update({ nickname, updated_at: nowISO() })
      .eq("user_id", userId)
      .eq("contact_id", contactId)
      .select(CONTACT_FIELDS)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ─── Security: password ────────────────────────────────────────────────────

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
    await supabase.from("users").update({ password_hash: hash, updated_at: nowISO() }).eq("id", userId);
    return true;
  },

  // ─── Security: two-step PIN ────────────────────────────────────────────────

  async enableTwoStep(userId, pin) {
    if (!pin || !/^\d{6}$/.test(pin)) throw new Error("PIN must be exactly 6 digits.");
    const pinHash = await bcrypt.hash(pin, PIN_ROUNDS);
    const { error } = await supabase
      .from("users")
      .update({ two_step_enabled: true, two_step_pin_hash: pinHash, two_step_enabled_at: nowISO() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async disableTwoStep(userId, pin) {
    const { data: user } = await supabase
      .from("users")
      .select("two_step_pin_hash, two_step_enabled")
      .eq("id", userId)
      .single();
    if (!user?.two_step_enabled) throw new Error("Two-step verification is not enabled.");

    const isValid = await bcrypt.compare(pin, user.two_step_pin_hash);
    if (!isValid) throw new Error("Incorrect PIN.");

    await supabase
      .from("users")
      .update({ two_step_enabled: false, two_step_pin_hash: null, two_step_enabled_at: null })
      .eq("id", userId);
    return true;
  },

  async changeTwoStepPin(userId, currentPin, newPin) {
    if (!newPin || !/^\d{6}$/.test(newPin)) throw new Error("New PIN must be exactly 6 digits.");

    const { data: user } = await supabase
      .from("users")
      .select("two_step_pin_hash, two_step_enabled")
      .eq("id", userId)
      .single();
    if (!user?.two_step_enabled) throw new Error("Two-step verification is not enabled.");

    const isValid = await bcrypt.compare(currentPin, user.two_step_pin_hash);
    if (!isValid) throw new Error("Current PIN is incorrect.");

    const newHash = await bcrypt.hash(newPin, PIN_ROUNDS);
    await supabase.from("users").update({ two_step_pin_hash: newHash }).eq("id", userId);
    return true;
  },

  // ─── Account deletion ──────────────────────────────────────────────────────
  /**
   * Delete the account. All child rows cascade-delete automatically via FK
   * ON DELETE CASCADE — no manual cleanup needed.
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

    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw new Error(error.message);
    return true;
  },

  async reportUser(reporterId, reportedUserId, reason) {
    const { error } = await supabase
      .from("user_reports")
      .insert({ reporter_id: reporterId, reported_user_id: reportedUserId, reason });
    if (error) console.warn("reportUser:", error.message);
    return true;
  },
};
