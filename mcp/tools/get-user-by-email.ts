import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const getUserByEmailSchema = z.object({
  email: z.string().describe("Email address of the user to look up"),
});

export async function getUserByEmail(input: z.infer<typeof getUserByEmailSchema>) {
  const supabase = await getSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", input.email)
    .single();

  if (error || !profile) {
    throw new Error(`User not found with email: ${input.email}`);
  }

  return profile;
}
