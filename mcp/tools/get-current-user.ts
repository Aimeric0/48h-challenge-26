import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const getCurrentUserSchema = z.object({});

export async function getCurrentUser() {
  const supabase = await getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(`Failed to get current user: ${error?.message ?? "no user session"}`);
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name ?? null,
  };
}
