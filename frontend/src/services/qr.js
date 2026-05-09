/**
 * @file src/services/qr.js
 * @description In-memory QR session store for linked-device authentication.
 *
 * Flow:
 *   1. Desktop client calls `generateQR` → gets a short-lived token
 *   2. Mobile client scans QR → calls `linkDevice(token, deviceInfo)`
 *   3. Server validates + consumes the token, then creates a `linked_devices` row
 *
 * Sessions are stored in-memory (Map) and expire after 2 minutes.
 * For multi-instance deployments this should be replaced with Redis.
 */

import { randomUUID } from "crypto";

const QR_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** @type {Map<string, { userId: string, createdAt: number }>} */
const sessions = new Map();

/**
 * Create a new QR session for `userId`.
 * The returned token is embedded in the QR code shown to the user.
 *
 * @param {string} userId
 * @returns {string} UUID token
 */
export function createQRSession(userId) {
  const token = randomUUID();
  sessions.set(token, { userId, createdAt: Date.now() });
  setTimeout(() => sessions.delete(token), QR_TTL_MS);
  return token;
}

/**
 * Retrieve a session by token without consuming it.
 * Returns `undefined` if the token is unknown or already consumed.
 *
 * @param {string} token
 * @returns {{ userId: string, createdAt: number }|undefined}
 */
export function getQRSession(token) {
  return sessions.get(token);
}

/**
 * Consume (delete) a session. Must be called after successful device linking
 * to prevent token reuse.
 *
 * @param {string} token
 */
export function deleteQRSession(token) {
  sessions.delete(token);
}
