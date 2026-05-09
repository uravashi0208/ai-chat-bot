/**
 * @file src/services/device.js
 * @description Linked device management.
 *
 * socket_id has been removed from the DB — socket IDs are ephemeral and
 * become stale on every server restart.  The gateway's in-memory
 * connectedUsers Map is the canonical source for live socket lookups.
 */

import { supabase } from "../config/supabase.js";

export async function addDevice(userId, deviceInfo) {
  const deviceName =
    deviceInfo?.deviceName ??
    deviceInfo?.device_name ??
    deviceInfo?.model ??
    "Unknown";

  const { data, error } = await supabase
    .from("linked_devices")
    .insert({
      user_id: userId,
      device_name: deviceName,
      device_info: deviceInfo ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDevices(userId) {
  const { data, error } = await supabase
    .from("linked_devices")
    .select("id, device_name, device_info, is_active, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Mark a device inactive and return the row so the gateway can
 * look up the socket ID from its in-memory Map and emit force-logout.
 */
export async function removeDevice(deviceId) {
  const { data, error } = await supabase
    .from("linked_devices")
    .update({ is_active: false })
    .eq("id", deviceId)
    .select("id, user_id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
