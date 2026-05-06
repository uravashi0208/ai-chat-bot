/**
 * @file src/services/auth.js
 * @description Authentication business logic.
 *
 * Covers three authentication flows:
 *   1. Phone OTP  — sendOtp → phoneCheck → (phoneRegister if new user)
 *   2. Classic    — register / login with email+password
 *   3. Session    — logout
 *
 * This service owns no HTTP or GraphQL details; it is purely data + logic.
 */

import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { signToken } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { generateOtp, nowISO, futureISO } from "../utils/helpers.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Private: SMS via Vonage ──────────────────────────────────────────────────

/**
 * Send a one-time password to a phone number via Vonage SMS.
 * Returns `true` on success, `false` on failure (never throws).
 *
 * @param {string} to  - E.164 phone number e.g. "+1234567890"
 * @param {string} otp - 6-digit code
 * @returns {Promise<boolean>}
 */
async function sendSmsViaVonage(to, otp) {
  const { VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM } = env;
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.warn("[OTP] Vonage credentials not configured. OTP:", otp);
    return false;
  }

  const body = new URLSearchParams({
    api_key: VONAGE_API_KEY,
    api_secret: VONAGE_API_SECRET,
    to: to.replace("+", ""),
    from: VONAGE_FROM,
    text: `Your verification code is: ${otp}. Valid for 10 minutes.`,
  });

  try {
    const res = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();

    if (data?.messages?.[0]?.status !== "0") {
      console.error("[OTP] Vonage error:", data?.messages?.[0]?.["error-text"]);
      return false;
    }

    console.log(`[OTP] SMS sent to ${to}`);
    return true;
  } catch (err) {
    console.error("[OTP] Vonage fetch failed:", err.message);
    return false;
  }
}

// ─── Private: Token creation ──────────────────────────────────────────────────

/**
 * Create a signed JWT for a user.
 * @param {{ id: string, username: string }} user
 * @returns {string}
 */
function createToken(user) {
  return signToken({ sub: user.id, username: user.username });
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Step 1 of phone auth — generate OTP, persist it, and dispatch via SMS.
   * In dev mode the OTP is returned in the response so manual testing is easy.
   *
   * @param {string} phone - E.164 number
   * @returns {Promise<{ sent: boolean, devOtp: string|null }>}
   */
  async sendOtp(phone) {
    const otp = generateOtp();
    const expiresAt = futureISO(OTP_TTL_MS);

    const { error } = await supabase.from("otp_verifications").upsert(
      {
        phone,
        otp,
        expires_at: expiresAt,
        verified: false,
        created_at: nowISO(),
      },
      { onConflict: "phone" },
    );
    if (error) throw new Error("Failed to store OTP. Please try again.");

    const smsSent = await sendSmsViaVonage(phone, otp);
    const devOtp = !smsSent && !env.IS_PROD ? otp : null;

    if (devOtp) console.log(`[DEV] OTP for ${phone}: ${devOtp}`);

    return { sent: true, devOtp };
  },

  /**
   * Step 2 of phone auth — verify OTP and return the user's token if they
   * already have an account, or `{ exists: false }` to trigger registration.
   *
   * @param {string} phone
   * @param {string} otp
   * @returns {Promise<{ exists: boolean, user: object|null, token: string|null }>}
   */
  async phoneCheck(phone, otp) {
    const { data: record } = await supabase
      .from("otp_verifications")
      .select("otp, expires_at, verified")
      .eq("phone", phone)
      .single();

    if (!record) throw new Error("OTP not found. Please request a new code.");
    if (record.verified)
      throw new Error("OTP already used. Please request a new code.");
    if (record.otp !== otp) throw new Error("Invalid OTP. Please try again.");
    if (new Date(record.expires_at) < new Date()) {
      throw new Error("OTP expired. Please request a new code.");
    }

    // Consume the OTP — single use only
    await supabase.from("otp_verifications").delete().eq("phone", phone);

    const { data: user } = await supabase
      .from("users")
      .select(
        "id, username, full_name, email, phone, avatar_url, about, status, last_seen, created_at",
      )
      .eq("phone", phone)
      .single();

    if (!user) return { exists: false, user: null, token: null };

    // Mark user online
    await supabase
      .from("users")
      .update({ status: "online", last_seen: nowISO() })
      .eq("id", user.id);

    return {
      exists: true,
      user: { ...user, status: "online" },
      token: createToken(user),
    };
  },

  /**
   * Step 3 of phone auth — register a brand-new user identified only by phone.
   *
   * @param {string}      phone
   * @param {string}      fullName
   * @param {string|null} username  - Auto-generated if omitted
   * @param {string|null} avatarUrl
   * @returns {Promise<{ user: object, token: string }>}
   */
  async phoneRegister(phone, fullName, username, avatarUrl) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();
    if (existing)
      throw new Error("Phone already registered. Please login instead.");

    const finalUsername =
      username?.trim() ??
      `user_${phone.replace(/\D/g, "").slice(-8)}_${Date.now().toString(36)}`;

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username: finalUsername,
        full_name: fullName.trim(),
        phone,
        avatar_url: avatarUrl ?? null,
        password_hash: "",
        status: "online",
      })
      .select(
        "id, username, full_name, email, phone, avatar_url, about, status, created_at",
      )
      .single();
    if (error) throw new Error(error.message);

    return { user, token: createToken(user) };
  },

  /**
   * Classic email + password registration.
   *
   * @param {string}      username
   * @param {string}      fullName
   * @param {string}      email
   * @param {string}      password
   * @param {string|null} phone
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register(username, fullName, email, password, phone) {
    const { data: conflict } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .single();
    if (conflict) throw new Error("Username or email already taken.");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username,
        full_name: fullName,
        email,
        phone,
        password_hash: passwordHash,
        status: "online",
      })
      .select(
        "id, username, full_name, email, phone, avatar_url, about, status, created_at",
      )
      .single();
    if (error) throw new Error(error.message);

    return { user, token: createToken(user) };
  },

  /**
   * Classic login with username/email and password.
   *
   * @param {string} identifier - Username or email
   * @param {string} password
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login(identifier, password) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .single();
    if (error || !user) throw new Error("Invalid credentials.");

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error("Invalid credentials.");

    await supabase
      .from("users")
      .update({ status: "online", last_seen: nowISO() })
      .eq("id", user.id);

    // Strip the hash before returning
    const { password_hash: _, ...safeUser } = user;
    return {
      user: { ...safeUser, status: "online" },
      token: createToken(user),
    };
  },

  /**
   * Mark the user offline. The JWT is stateless and cannot be revoked server-
   * side, so the client must discard it.
   *
   * @param {string} userId
   * @returns {Promise<true>}
   */
  async logout(userId) {
    await supabase
      .from("users")
      .update({ status: "offline", last_seen: nowISO() })
      .eq("id", userId);
    return true;
  },
};
