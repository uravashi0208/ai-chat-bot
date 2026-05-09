/**
 * @file src/services/auth.js
 * @description Authentication business logic.
 *
 * OTP change: the `verified` boolean column has been removed from
 * otp_verifications. Deleting the row on first successful use is the
 * consumed marker — no boolean needed.
 *
 * Three authentication flows:
 *   1. Phone OTP  — sendOtp → phoneCheck → (phoneRegister if new user)
 *   2. Classic    — register / login with email + password
 *   3. Session    — logout
 */

import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { signToken } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { generateOtp, nowISO, futureISO } from "../utils/helpers.js";

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS    = 10 * 60 * 1000; // 10 minutes

// ─── Private: SMS via Vonage ──────────────────────────────────────────────────

async function sendSmsViaVonage(to, otp) {
  const { VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM } = env;
  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.warn("[OTP] Vonage credentials not configured. OTP:", otp);
    return false;
  }

  const body = new URLSearchParams({
    api_key:    VONAGE_API_KEY,
    api_secret: VONAGE_API_SECRET,
    to:         to.replace("+", ""),
    from:       VONAGE_FROM,
    text:       `Your verification code is: ${otp}. Valid for 10 minutes.`,
  });

  try {
    const res  = await fetch("https://rest.nexmo.com/sms/json", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
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

function createToken(user) {
  return signToken({ sub: user.id, username: user.username });
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Step 1 — Generate OTP, persist it (upsert so re-requests overwrite), send SMS.
   * In dev mode the OTP is returned in the response payload for easy testing.
   */
  async sendOtp(phone) {
    const otp       = generateOtp();
    const expiresAt = futureISO(OTP_TTL_MS);

    // Upsert on phone — one row per number, always up-to-date
    const { error } = await supabase
      .from("otp_verifications")
      .upsert(
        { phone, otp, expires_at: expiresAt, created_at: nowISO() },
        { onConflict: "phone" },
      );
    if (error) throw new Error("Failed to store OTP. Please try again.");

    const smsSent = await sendSmsViaVonage(phone, otp);
    const devOtp  = !smsSent && !env.IS_PROD ? otp : null;
    if (devOtp) console.log(`[DEV] OTP for ${phone}: ${devOtp}`);

    return { sent: true, devOtp };
  },

  /**
   * Step 2 — Verify OTP and return token if user exists, else signal registration needed.
   * The OTP row is deleted immediately after a successful check (single-use).
   */
  async phoneCheck(phone, otp) {
    const { data: record } = await supabase
      .from("otp_verifications")
      .select("otp, expires_at")
      .eq("phone", phone)
      .single();

    if (!record)                              throw new Error("OTP not found. Please request a new code.");
    if (record.otp !== otp)                   throw new Error("Invalid OTP. Please try again.");
    if (new Date(record.expires_at) < new Date()) throw new Error("OTP expired. Please request a new code.");

    // Consume immediately — row deletion IS the consumed marker
    await supabase.from("otp_verifications").delete().eq("phone", phone);

    const { data: user } = await supabase
      .from("users")
      .select("id, username, full_name, email, phone, avatar_url, about, status, last_seen, created_at")
      .eq("phone", phone)
      .single();

    if (!user) return { exists: false, user: null, token: null };

    await supabase
      .from("users")
      .update({ status: "online", last_seen: nowISO() })
      .eq("id", user.id);

    return { exists: true, user: { ...user, status: "online" }, token: createToken(user) };
  },

  /**
   * Step 3 — Register a brand-new user identified only by phone number.
   */
  async phoneRegister(phone, fullName, username, avatarUrl) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();
    if (existing) throw new Error("Phone already registered. Please login instead.");

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
      .select("id, username, full_name, email, phone, avatar_url, about, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { user, token: createToken(user) };
  },

  /**
   * Classic email + password registration.
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
      .insert({ username, full_name: fullName, email, phone, password_hash: passwordHash, status: "online" })
      .select("id, username, full_name, email, phone, avatar_url, about, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { user, token: createToken(user) };
  },

  /**
   * Classic login with username/email and password.
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

    const { password_hash: _, ...safeUser } = user;
    return { user: { ...safeUser, status: "online" }, token: createToken(user) };
  },

  /**
   * Mark the user offline. JWT is stateless — client must discard the token.
   */
  async logout(userId) {
    await supabase
      .from("users")
      .update({ status: "offline", last_seen: nowISO() })
      .eq("id", userId);
    return true;
  },
};
