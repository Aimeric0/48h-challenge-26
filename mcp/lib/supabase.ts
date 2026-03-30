import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const userToken = process.env.SUPABASE_USER_ACCESS_TOKEN;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
}

if (!userToken) {
  throw new Error(
    "Missing SUPABASE_USER_ACCESS_TOKEN. " +
    "The MCP server must be started with the authenticated user's JWT to enforce RLS policies."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  },
});
