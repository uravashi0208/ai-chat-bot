/**
 * @file src/services/device.js
 * @description Linked device management (multi-device support).
 *
 * A "linked device" is any secondary client (tablet, another browser tab, etc.)
 * that is authenticated via QR code scan.  Each active device has a socket_id
 * so the gateway can emit `force-logout` when the device is removed.
 */

import { supabase } from "../config/supabase.js";

/**
 * Persist a newly linked device.
 * The `socket_id` starts null and is populated once the device establishes a
 * WebSocket connection.
 *
 * @param {string} userId
 * @param {object} deviceInfo - Arbitrary metadata sent by the client (browser, OS, etc.)
 * @returns {Promise<object>}
 */
export async function addDevice(userId, deviceInfo) {
  const { data } = await supabase
    .from("linked_devices")
    .insert({
      user_id: userId,
      device_name: deviceInfo.browser ?? "Unknown",
      device_info: deviceInfo,
      is_active: true,
    })
    .select()
    .single();
  return data;
}

/**
 * Return all currently active linked devices for a user.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getDevices(userId) {
  const { data } = await supabase
    .from("linked_devices")
    .select("id, device_name, device_info, is_active, created_at")
    .eq("user_id", userId)
    .eq("is_active", true);
  return data ?? [];
}

/**
 * Soft-remove a linked device by setting `is_active = false`.
 * Returns the row so the caller can read `socket_id` and emit `force-logout`.
 *
 * @param {string} deviceId
 * @returns {Promise<object|null>}
 */
export async function removeDevice(deviceId) {
  const { data } = await supabase
    .from("linked_devices")
    .update({ is_active: false })
    .eq("id", deviceId)
    .select()
    .single();
  return data ?? null;
}
