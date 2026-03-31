import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const updateProfileSchema = z.object({
  user_id: z.string().describe("ID of the user whose profile to update"),
  first_name: z.string().optional().describe("New first name"),
  last_name: z.string().optional().describe("New last name"),
});

export async function updateProfile(input: z.infer<typeof updateProfileSchema>) {
  const supabase = await getSupabase();
  const { user_id, first_name, last_name } = input;

  if (first_name === undefined && last_name === undefined) {
    throw new Error("At least one of first_name or last_name must be provided");
  }

  // Build full_name from provided parts, fetching existing values if needed
  let fullName: string;
  if (first_name !== undefined && last_name !== undefined) {
    fullName = `${first_name} ${last_name}`.trim();
  } else {
    const { data: existing } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user_id)
      .single();
    const parts = (existing?.full_name ?? "").split(" ");
    const currentFirst = parts[0] ?? "";
    const currentLast = parts.slice(1).join(" ") ?? "";
    fullName = `${first_name ?? currentFirst} ${last_name ?? currentLast}`.trim();
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user_id)
    .select("id, full_name, email, avatar_url")
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return profile;
}
