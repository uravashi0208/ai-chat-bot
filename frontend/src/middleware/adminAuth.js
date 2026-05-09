/**
 * @file src/middleware/adminAuth.js
 * @description Admin-specific authentication guard.
 *
 * `requireAdmin` is intentionally separate from `requireAuth` so that regular
 * users can never accidentally gain admin access even if the JWT is valid.
 *
 * The JWT payload must contain `role: "admin"` (set by adminService).
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

/**
 * Extract and verify the admin JWT from a request.
 * Returns the admin record or null — never throws.
 *
 * @param {import('express').Request} req
 * @returns {Promise<object|null>}
 */
export async function getAdminFromRequest(req) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== "admin") return null;

    const { data } = await supabase
      .from("admins")
      .select("id, username, email, created_at")
      .eq("id", payload.sub)
      .single();

    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolver-level admin guard.
 * Throws a GraphQL-friendly error when the caller is not an authenticated admin.
 *
 * @param {object|null} admin  — from GraphQL context
 * @throws {Error}
 *
 * @example
 * adminUsers: (_, __, { admin }) => {
 *   requireAdmin(admin);
 *   return adminService.listUsers();
 * }
 */
export function requireAdmin(admin) {
  if (!admin) throw new Error("Unauthorized: admin access required.");
}
