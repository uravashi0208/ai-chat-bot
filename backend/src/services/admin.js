/**
 * @file src/services/admin.js
 * @description Admin panel business logic.
 *
 * Covers:
 *  1.  Admin authentication (register / login)
 *  2.  User management (list, status toggle)
 *  3.  Emoji category CRUD
 *  4.  Emoji CRUD
 *  5.  Chat theme color categories + theme colors CRUD
 *  6.  Chat wallpaper categories + wallpapers CRUD
 *  7.  Feedback list
 *  8.  Contact-us list
 *  9.  Privacy Policy / Terms & Conditions (single-record upsert)
 *  10. FAQ CRUD
 *
 * Status codes used throughout:
 *   0 = Inactive, 1 = Active, 2 = Deleted
 *
 * Admin role guard is enforced in resolvers — this layer trusts the caller.
 */

import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { signToken } from "../middleware/auth.js";
import { nowISO } from "../utils/helpers.js";

const BCRYPT_ROUNDS = 12;

// ─── Private helpers ──────────────────────────────────────────────────────────

function createAdminToken(admin) {
  return signToken({ sub: admin.id, username: admin.username, role: "admin" });
}

async function assertExists(table, id, label) {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .neq("status", 2)
    .single();
  if (!data) throw new Error(`${label} not found.`);
}

// ─── 1. Admin Auth ────────────────────────────────────────────────────────────

export const adminService = {
  // ─── Profile ─────────────────────────────────────────────────────────────────

  /**
   * Fetch the currently-logged-in admin by id.
   */
  async getMe(adminId) {
    const { data, error } = await supabase
      .from("admins")
      .select(
        "id, username, email, full_name, phone, avatar_url, about, facebook, instagram, linkedin, twitter, created_at",
      )
      .eq("id", adminId)
      .single();
    if (error || !data) throw new Error("Admin not found.");
    return data;
  },

  /**
   * Update admin profile fields (excludes email/password).
   */
  async updateProfile(adminId, fields) {
    const updates = {};
    if (fields.fullName !== undefined) updates.full_name = fields.fullName;
    if (fields.phone !== undefined) updates.phone = fields.phone;
    if (fields.about !== undefined) updates.about = fields.about;
    if (fields.avatarUrl !== undefined) updates.avatar_url = fields.avatarUrl;
    if (fields.facebook !== undefined) updates.facebook = fields.facebook;
    if (fields.instagram !== undefined) updates.instagram = fields.instagram;
    if (fields.linkedin !== undefined) updates.linkedin = fields.linkedin;
    if (fields.twitter !== undefined) updates.twitter = fields.twitter;
    updates.updated_at = nowISO();

    const { data, error } = await supabase
      .from("admins")
      .update(updates)
      .eq("id", adminId)
      .select(
        "id, username, email, full_name, phone, avatar_url, about, facebook, instagram, linkedin, twitter, created_at",
      )
      .single();
    if (error || !data) throw new Error("Failed to update admin profile.");
    return data;
  },

  /**
   * Change admin password after verifying old password.
   */
  async changePassword(adminId, oldPassword, newPassword) {
    const { data: admin } = await supabase
      .from("admins")
      .select("id, password_hash")
      .eq("id", adminId)
      .single();
    if (!admin) throw new Error("Admin not found.");

    const valid = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!valid) throw new Error("Old password is incorrect.");
    if (newPassword.length < 6)
      throw new Error("New password must be at least 6 characters.");

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const { error } = await supabase
      .from("admins")
      .update({ password_hash, updated_at: nowISO() })
      .eq("id", adminId);
    if (error) throw new Error("Failed to change password.");
    return true;
  },
  /**
   * Register a new admin account.
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ admin: object, token: string }>}
   */
  async register(username, email, password) {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existing) throw new Error("Username or email already in use.");

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { data, error } = await supabase
      .from("admins")
      .insert({ username, email, password_hash, created_at: nowISO() })
      .select("id, username, email, created_at")
      .single();

    if (error || !data) throw new Error("Admin registration failed.");

    return { admin: data, token: createAdminToken(data) };
  },

  /**
   * Login an admin with email or username.
   * @param {string} identifier  email or username
   * @param {string} password
   * @returns {Promise<{ admin: object, token: string }>}
   */
  async login(identifier, password) {
    const { data: admin } = await supabase
      .from("admins")
      .select(
        "id, username, full_name, email, phone, avatar_url, about, password_hash, created_at",
      )
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .single();

    if (!admin) throw new Error("Invalid credentials.");

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) throw new Error("Invalid credentials.");

    const { password_hash: _, ...safeAdmin } = admin;
    return { admin: safeAdmin, token: createAdminToken(safeAdmin) };
  },

  // ─── 2. User Management ─────────────────────────────────────────────────────

  /**
   * Paginated list of all app users.
   * @param {{ limit?: number, offset?: number, search?: string }} opts
   */
  async listUsers({ limit = 50, offset = 0, search } = {}) {
    let query = supabase
      .from("users")
      .select(
        "id, username, full_name, email, phone, avatar_url, status, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw new Error("Failed to fetch users.");
    return { users: data ?? [], total: count ?? 0 };
  },

  /**
   * Toggle a user's active/inactive status (0 ↔ 1).
   * @param {string} userId
   * @param {number} status  0 or 1
   */
  async setUserStatus(userId, status) {
    if (![0, 1].includes(status)) throw new Error("Status must be 0 or 1.");
    const { data, error } = await supabase
      .from("users")
      .update({ status: status === 1 ? "active" : "inactive" })
      .eq("id", userId)
      .select("id, username, full_name, email, status")
      .single();
    if (error || !data) throw new Error("User not found.");
    return data;
  },

  // ─── 3. Emoji Categories ────────────────────────────────────────────────────

  async createEmojiCategory(categoryName, status = 1) {
    const { data, error } = await supabase
      .from("emoji_categories")
      .insert({ category_name: categoryName, status, created_at: nowISO() })
      .select()
      .single();
    if (error) throw new Error("Failed to create emoji category.");
    return data;
  },

  async listEmojiCategories() {
    const { data, error } = await supabase
      .from("emoji_categories")
      .select("*")
      .neq("status", 2)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch emoji categories.");
    return data ?? [];
  },

  async updateEmojiCategory(id, fields) {
    await assertExists("emoji_categories", id, "Emoji category");
    const { data, error } = await supabase
      .from("emoji_categories")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error("Failed to update emoji category.");
    return data;
  },

  async deleteEmojiCategory(id) {
    await assertExists("emoji_categories", id, "Emoji category");
    const { error } = await supabase
      .from("emoji_categories")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    if (error) throw new Error("Failed to delete emoji category.");
    return true;
  },

  // ─── 4. Emojis ──────────────────────────────────────────────────────────────

  async createEmoji(emoji, categoryId, status = 1) {
    await assertExists("emoji_categories", categoryId, "Emoji category");
    const { data, error } = await supabase
      .from("emojis")
      .insert({
        emoji,
        category_id: categoryId,
        status,
        created_at: nowISO(),
      })
      .select(`*, category:emoji_categories(id, category_name)`)
      .single();
    if (error) throw new Error("Failed to create emoji.");
    return data;
  },

  async listEmojis(categoryId, { limit = 20, offset = 0, search } = {}) {
    // ── Count queries (for accurate tab counts across ALL pages) ──────────────
    let countBase = supabase
      .from("emojis")
      .select("id, status", { count: "exact", head: false })
      .neq("status", 2);
    if (categoryId) countBase = countBase.eq("category_id", categoryId);
    if (search) countBase = countBase.ilike("emoji", `%${search}%`);

    const { data: allForCount, error: countErr } = await countBase;
    if (countErr) throw new Error("Failed to fetch emoji counts.");

    const total = allForCount?.length ?? 0;
    const totalActive = allForCount?.filter((r) => r.status === 1).length ?? 0;
    const totalInactive =
      allForCount?.filter((r) => r.status === 0).length ?? 0;

    // ── Paginated items ───────────────────────────────────────────────────────
    let query = supabase
      .from("emojis")
      .select(`*, category:emoji_categories(id, category_name)`)
      .neq("status", 2)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("emoji", `%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch emojis.");
    return { items: data ?? [], total, totalActive, totalInactive };
  },

  async updateEmoji(id, fields) {
    if (fields.category_id) {
      await assertExists(
        "emoji_categories",
        fields.category_id,
        "Emoji category",
      );
    }
    const { data, error } = await supabase
      .from("emojis")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .neq("status", 2)
      .select(`*, category:emoji_categories(id, category_name)`)
      .single();
    if (error || !data) throw new Error("Emoji not found or update failed.");
    return data;
  },

  async deleteEmoji(id) {
    const { error } = await supabase
      .from("emojis")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    if (error) throw new Error("Failed to delete emoji.");
    return true;
  },

  // ─── 5. Chat Theme Color Categories ─────────────────────────────────────────

  async createThemeColorCategory(categoryName, status = 1) {
    const { data, error } = await supabase
      .from("theme_color_categories")
      .insert({ category_name: categoryName, status, created_at: nowISO() })
      .select()
      .single();
    if (error) throw new Error("Failed to create theme color category.");
    return data;
  },

  async listThemeColorCategories() {
    const { data, error } = await supabase
      .from("theme_color_categories")
      .select("*")
      .neq("status", 2)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch theme color categories.");
    return data ?? [];
  },

  async updateThemeColorCategory(id, fields) {
    await assertExists("theme_color_categories", id, "Theme color category");
    const { data, error } = await supabase
      .from("theme_color_categories")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error("Failed to update theme color category.");
    return data;
  },

  async deleteThemeColorCategory(id) {
    await assertExists("theme_color_categories", id, "Theme color category");
    await supabase
      .from("theme_color_categories")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    return true;
  },

  // ─── 5b. Chat Theme Colors ───────────────────────────────────────────────────

  async createThemeColor(colorName, colorCode, categoryId, status = 1) {
    await assertExists(
      "theme_color_categories",
      categoryId,
      "Theme color category",
    );
    const { data, error } = await supabase
      .from("theme_colors")
      .insert({
        color_name: colorName,
        color_code: colorCode,
        category_id: categoryId,
        status,
        created_at: nowISO(),
      })
      .select(`*, category:theme_color_categories(id, category_name)`)
      .single();
    if (error) throw new Error("Failed to create theme color.");
    return data;
  },

  async listThemeColors(categoryId, { limit = 20, offset = 0, search } = {}) {
    // ── Count queries ─────────────────────────────────────────────────────────
    let countBase = supabase
      .from("theme_colors")
      .select("id, status", { count: "exact", head: false })
      .neq("status", 2);
    if (categoryId) countBase = countBase.eq("category_id", categoryId);
    if (search) countBase = countBase.ilike("color_name", `%${search}%`);

    const { data: allForCount, error: countErr } = await countBase;
    if (countErr) throw new Error("Failed to fetch theme color counts.");

    const total = allForCount?.length ?? 0;
    const totalActive = allForCount?.filter((r) => r.status === 1).length ?? 0;
    const totalInactive =
      allForCount?.filter((r) => r.status === 0).length ?? 0;

    // ── Paginated items ───────────────────────────────────────────────────────
    let query = supabase
      .from("theme_colors")
      .select(`*, category:theme_color_categories(id, category_name)`)
      .neq("status", 2)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("color_name", `%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch theme colors.");
    return { items: data ?? [], total, totalActive, totalInactive };
  },

  async updateThemeColor(id, fields) {
    if (fields.category_id) {
      await assertExists(
        "theme_color_categories",
        fields.category_id,
        "Theme color category",
      );
    }
    const { data, error } = await supabase
      .from("theme_colors")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .neq("status", 2)
      .select(`*, category:theme_color_categories(id, category_name)`)
      .single();
    if (error || !data) throw new Error("Theme color not found.");
    return data;
  },

  async deleteThemeColor(id) {
    await supabase
      .from("theme_colors")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    return true;
  },

  // ─── 6. Chat Wallpaper Categories ───────────────────────────────────────────

  async createWallpaperCategory(categoryName, status = 1) {
    const { data, error } = await supabase
      .from("wallpaper_categories")
      .insert({ category_name: categoryName, status, created_at: nowISO() })
      .select()
      .single();
    if (error) throw new Error("Failed to create wallpaper category.");
    return data;
  },

  async listWallpaperCategories() {
    const { data, error } = await supabase
      .from("wallpaper_categories")
      .select("*")
      .neq("status", 2)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch wallpaper categories.");
    return data ?? [];
  },

  async updateWallpaperCategory(id, fields) {
    await assertExists("wallpaper_categories", id, "Wallpaper category");
    const { data, error } = await supabase
      .from("wallpaper_categories")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error("Failed to update wallpaper category.");
    return data;
  },

  async deleteWallpaperCategory(id) {
    await assertExists("wallpaper_categories", id, "Wallpaper category");
    await supabase
      .from("wallpaper_categories")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    return true;
  },

  // ─── 6b. Chat Wallpapers ─────────────────────────────────────────────────────

  async createWallpaper(title, imageUrl, categoryId, status = 1) {
    await assertExists(
      "wallpaper_categories",
      categoryId,
      "Wallpaper category",
    );
    const { data, error } = await supabase
      .from("chat_wallpapers")
      .insert({
        title,
        image_url: imageUrl,
        category_id: categoryId,
        status,
        created_at: nowISO(),
      })
      .select(`*, category:wallpaper_categories(id, category_name)`)
      .single();
    if (error) throw new Error("Failed to create wallpaper.");
    return data;
  },

  async listWallpapers(categoryId, { limit = 20, offset = 0, search } = {}) {
    // ── Count queries ─────────────────────────────────────────────────────────
    let countBase = supabase
      .from("chat_wallpapers")
      .select("id, status", { count: "exact", head: false })
      .neq("status", 2);
    if (categoryId) countBase = countBase.eq("category_id", categoryId);
    if (search) countBase = countBase.ilike("title", `%${search}%`);

    const { data: allForCount, error: countErr } = await countBase;
    if (countErr) throw new Error("Failed to fetch wallpaper counts.");

    const total = allForCount?.length ?? 0;
    const totalActive = allForCount?.filter((r) => r.status === 1).length ?? 0;
    const totalInactive =
      allForCount?.filter((r) => r.status === 0).length ?? 0;

    // ── Paginated items ───────────────────────────────────────────────────────
    let query = supabase
      .from("chat_wallpapers")
      .select(`*, category:wallpaper_categories(id, category_name)`)
      .neq("status", 2)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch wallpapers.");
    return { items: data ?? [], total, totalActive, totalInactive };
  },

  async updateWallpaper(id, fields) {
    if (fields.category_id) {
      await assertExists(
        "wallpaper_categories",
        fields.category_id,
        "Wallpaper category",
      );
    }
    const { data, error } = await supabase
      .from("chat_wallpapers")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .neq("status", 2)
      .select(`*, category:wallpaper_categories(id, category_name)`)
      .single();
    if (error || !data) throw new Error("Wallpaper not found.");
    return data;
  },

  async deleteWallpaper(id) {
    await supabase
      .from("chat_wallpapers")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    return true;
  },

  // ─── 7. Feedback ─────────────────────────────────────────────────────────────

  async listFeedback({ limit = 50, offset = 0 } = {}) {
    const { data, count, error } = await supabase
      .from("feedback")
      .select(
        `id, rating, message, created_at,
         user:user_id(id, username, full_name, email, avatar_url)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error("Failed to fetch feedback.");
    return { items: data ?? [], total: count ?? 0 };
  },

  // ─── 8. Contact-us ───────────────────────────────────────────────────────────

  async listContactUs({ limit = 50, offset = 0 } = {}) {
    const { data, count, error } = await supabase
      .from("contact_us")
      .select(`id, name, email, phone, subject, message, is_read, created_at`, {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error("Failed to fetch contact-us submissions.");
    return { items: data ?? [], total: count ?? 0 };
  },

  async markContactUsRead(id) {
    const { data, error } = await supabase
      .from("contact_us")
      .update({ is_read: true, updated_at: nowISO() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error("Contact-us entry not found.");
    return data;
  },

  // ─── 9. Privacy Policy & Terms of Condition ──────────────────────────────────
  // Single-record tables — upsert on a well-known `slug` key.

  async getPage(slug) {
    const { data } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .single();
    return data ?? null;
  },

  async upsertPage(slug, title, content) {
    const { data, error } = await supabase
      .from("cms_pages")
      .upsert(
        { slug, title, content, updated_at: nowISO() },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (error) throw new Error(`Failed to save ${slug} page.`);
    return data;
  },

  // ─── 10. FAQ ─────────────────────────────────────────────────────────────────

  async createFaq(question, answer, sortOrder = 0, status = 1) {
    const { data, error } = await supabase
      .from("faqs")
      .insert({
        question,
        answer,
        sort_order: sortOrder,
        status,
        created_at: nowISO(),
      })
      .select()
      .single();
    if (error) throw new Error("Failed to create FAQ.");
    return data;
  },

  async listFaqs(includeInactive = false) {
    let query = supabase
      .from("faqs")
      .select("*")
      .neq("status", 2)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!includeInactive) query = query.eq("status", 1);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch FAQs.");
    return data ?? [];
  },

  async getFaq(id) {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("id", id)
      .neq("status", 2)
      .single();
    if (error || !data) throw new Error("FAQ not found.");
    return data;
  },

  async updateFaq(id, fields) {
    const { data, error } = await supabase
      .from("faqs")
      .update({ ...fields, updated_at: nowISO() })
      .eq("id", id)
      .neq("status", 2)
      .select()
      .single();
    if (error || !data) throw new Error("FAQ not found or update failed.");
    return data;
  },

  async deleteFaq(id) {
    const { error } = await supabase
      .from("faqs")
      .update({ status: 2, updated_at: nowISO() })
      .eq("id", id);
    if (error) throw new Error("Failed to delete FAQ.");
    return true;
  },
};
