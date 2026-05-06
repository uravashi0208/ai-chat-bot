/**
 * @file src/config/supabase.js
 * @description Supabase client singleton.
 *
 * Import `supabase` from this file anywhere in the codebase.
 * The service-role key bypasses Row Level Security — never expose it
 * to the client. All user-level checks are enforced in the service layer.
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
);
