import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const email = process.env.MCP_USER_EMAIL;
const password = process.env.MCP_USER_PASSWORD;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
}

if (!email || !password) {
  throw new Error(
    "Missing MCP_USER_EMAIL or MCP_USER_PASSWORD. " +
    "The MCP server must be started with user credentials to enforce RLS policies."
  );
}

const client = createClient(url, anonKey, {
  auth: { autoRefreshToken: true, persistSession: false },
});

let initialized = false;

/**
 * Sign in and return the authenticated Supabase client.
 * Caches the session — subsequent calls return immediately.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (!initialized) {
    const { error } = await client.auth.signInWithPassword({ email: email!, password: password! });
    if (error) {
      throw new Error(`MCP auth failed for ${email}: ${error.message}`);
    }
    initialized = true;
    console.error(`MCP authenticated as ${email}`);
  }
  return client;
}
