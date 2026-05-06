/**
 * @file src/middleware/auth.js
 * @description Authentication middleware for Apollo context and Socket.IO.
 *
 * Design decisions:
 *  - Non-throwing: an invalid/missing token resolves to `user: null`.
 *    GraphQL resolvers that need auth call `requireAuth()` themselves,
 *    which keeps authentication and authorisation concerns separate.
 *  - Token extraction is a pure function so it can be reused by the
 *    WebSocket gateway without reimplementing the same logic.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { getAdminFromRequest } from "./adminAuth.js";

// ─── JWT Helpers (also used by authService) ───────────────────────────────────

/**
 * Sign a JWT with the application secret.
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT. Throws if invalid or expired.
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

// ─── User Lookup ──────────────────────────────────────────────────────────────

/**
 * Fetch a minimal user record from Supabase by primary key.
 * Returns `null` if the user no longer exists (e.g. deleted account).
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findUserById(userId) {
  const { data } = await supabase
    .from("users")
    .select("id, username, full_name, email, avatar_url, about, status")
    .eq("id", userId)
    .single();
  return data ?? null;
}

// ─── Token → User ─────────────────────────────────────────────────────────────

/**
 * Resolve a raw JWT string to a user object, or `null` on any error.
 * Safe to call with untrusted input.
 *
 * @param {string|null|undefined} token
 * @returns {Promise<object|null>}
 */
export async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    return await findUserById(payload.sub);
  } catch {
    return null;
  }
}

// ─── Apollo Context Builder ───────────────────────────────────────────────────

/**
 * Passed to `expressMiddleware` as the `context` factory.
 * Attaches the authenticated user (or `null`) to the GraphQL context.
 *
 * @param {{ req: import('express').Request }} ctx
 * @returns {Promise<{ user: object|null }>}
 */
export async function buildContext({ req }) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Resolve both user and admin in parallel — only one will be non-null
  const [user, admin] = await Promise.all([
    getUserFromToken(token),
    getAdminFromRequest(req),
  ]);

  return { user, admin };
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/**
 * Resolver-level authentication guard.
 * Throws a GraphQL-friendly error if the user is not authenticated.
 *
 * @param {object|null} user - Value from GraphQL context
 * @throws {Error} If `user` is falsy
 *
 * @example
 * // In a resolver:
 * me: (_, __, { user }) => {
 *   requireAuth(user);
 *   return usersService.findById(user.id);
 * }
 */
export function requireAuth(user) {
  if (!user) throw new Error("Unauthorized");
}
