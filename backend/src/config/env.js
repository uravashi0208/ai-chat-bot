/**
 * @file src/config/env.js
 * @description Centralised environment configuration with validation.
 *
 * All process.env access is isolated here so the rest of the codebase
 * never touches process.env directly. Crashes fast on missing required vars
 * so misconfigurations surface at startup, not at runtime.
 */

import "dotenv/config";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read a required environment variable. Throws at startup if it is missing.
 * @param {string} key
 * @returns {string}
 */
function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

/**
 * Read an optional environment variable with a default fallback.
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(key, defaultValue = "") {
  return process.env[key] ?? defaultValue;
}

// ─── Exported Config ──────────────────────────────────────────────────────────

export const env = Object.freeze({
  // Server
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: parseInt(optional("PORT", "4000"), 10),
  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:3000"),
  IS_PROD: process.env.NODE_ENV === "production",

  // Supabase
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: required("SUPABASE_SERVICE_KEY"),

  // Auth
  JWT_SECRET: optional("JWT_SECRET", "change-me"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),

  // Vonage SMS
  VONAGE_API_KEY: optional("VONAGE_API_KEY"),
  VONAGE_API_SECRET: optional("VONAGE_API_SECRET"),
  VONAGE_FROM: optional("VONAGE_FROM", "ChatApp"),

  // Groq AI proxy
  GROQ_API_KEY: optional("GROQ_API_KEY"),
});
