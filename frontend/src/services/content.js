/**
 * @file src/services/content.js
 * @description User-auth content service.
 *
 * Covers (all require a valid user JWT):
 *  1.  Emoji Categories  — list active
 *  2.  Emojis            — list active (optionally filtered by category)
 *  3.  Theme Color Categories — list active
 *  4.  Theme Colors      — list active (optionally filtered by category)
 *  5.  Wallpaper Categories — list active
 *  6.  Chat Wallpapers   — list active (optionally filtered by category)
 *  7.  CMS Pages         — get privacy-policy / terms-conditions
 *  8.  FAQs              — list active only
 *
 * Status convention (shared with admin module):
 *   0 = Inactive, 1 = Active, 2 = Deleted
 *
 * Auth guard is enforced in resolvers — this layer trusts the caller.
 */

import { supabase } from "../config/supabase.js";

export const contentService = {
  // ─── 1. Emoji Categories ────────────────────────────────────────────────────

  /**
   * List all active emoji categories.
   * @returns {Promise<object[]>}
   */
  async listEmojiCategories() {
    const { data, error } = await supabase
      .from("emoji_categories")
      .select("id, category_name, status, created_at, updated_at")
      .eq("status", 1)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch emoji categories.");
    return data ?? [];
  },

  // ─── 2. Emojis ──────────────────────────────────────────────────────────────

  /**
   * List all active emojis, optionally filtered by category.
   * @param {string|null|undefined} categoryId
   * @returns {Promise<object[]>}
   */
  async listEmojis(categoryId) {
    let query = supabase
      .from("emojis")
      .select("*, category:emoji_categories(id, category_name)")
      .eq("status", 1)
      .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch emojis.");
    return data ?? [];
  },

  // ─── 3. Theme Color Categories ──────────────────────────────────────────────

  /**
   * List all active theme color categories.
   * @returns {Promise<object[]>}
   */
  async listThemeColorCategories() {
    const { data, error } = await supabase
      .from("theme_color_categories")
      .select("id, category_name, status, created_at, updated_at")
      .eq("status", 1)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch theme color categories.");
    return data ?? [];
  },

  // ─── 4. Theme Colors ────────────────────────────────────────────────────────

  /**
   * List all active theme colors, optionally filtered by category.
   * @param {string|null|undefined} categoryId
   * @returns {Promise<object[]>}
   */
  async listThemeColors(categoryId) {
    let query = supabase
      .from("theme_colors")
      .select("*, category:theme_color_categories(id, category_name)")
      .eq("status", 1)
      .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch theme colors.");
    return data ?? [];
  },

  // ─── 5. Wallpaper Categories ─────────────────────────────────────────────────

  /**
   * List all active wallpaper categories.
   * @returns {Promise<object[]>}
   */
  async listWallpaperCategories() {
    const { data, error } = await supabase
      .from("wallpaper_categories")
      .select("id, category_name, status, created_at, updated_at")
      .eq("status", 1)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch wallpaper categories.");
    return data ?? [];
  },

  // ─── 6. Chat Wallpapers ──────────────────────────────────────────────────────

  /**
   * List all active wallpapers, optionally filtered by category.
   * @param {string|null|undefined} categoryId
   * @returns {Promise<object[]>}
   */
  async listWallpapers(categoryId) {
    let query = supabase
      .from("chat_wallpapers")
      .select("*, category:wallpaper_categories(id, category_name)")
      .eq("status", 1)
      .order("created_at", { ascending: false });

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch wallpapers.");
    return data ?? [];
  },

  // ─── 7. CMS Pages ────────────────────────────────────────────────────────────

  /**
   * Fetch a CMS page by slug.
   * @param {string} slug  e.g. "privacy-policy" | "terms-conditions"
   * @returns {Promise<object|null>}
   */
  async getPage(slug) {
    const { data } = await supabase
      .from("cms_pages")
      .select("id, slug, title, content, updated_at")
      .eq("slug", slug)
      .single();
    return data ?? null;
  },

  // ─── 8. FAQs ─────────────────────────────────────────────────────────────────

  /**
   * List all active FAQs ordered by sort_order.
   * @returns {Promise<object[]>}
   */
  async listFaqs() {
    const { data, error } = await supabase
      .from("faqs")
      .select(
        "id, question, answer, sort_order, status, created_at, updated_at",
      )
      .eq("status", 1)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch FAQs.");
    return data ?? [];
  },
};
