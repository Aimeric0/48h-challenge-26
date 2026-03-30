import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const inviteMemberSchema = z.object({
  project_id: z.string().describe("ID of the project"),
  email: z.string().describe("Email of the user to invite"),
  role: z.string().optional().default("member").describe("Role to assign (default: member)"),
});

export async function inviteMember(input: z.infer<typeof inviteMemberSchema>) {
  const supabase = await getSupabase();
  // Find the user by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", input.email)
    .single();

  if (profileError || !profile) {
    throw new Error(`User not found with email: ${input.email}`);
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", input.project_id)
    .eq("user_id", profile.id)
    .single();

  if (existing) {
    throw new Error(`User ${input.email} is already a member of this project`);
  }

  // Add as member
  const { error } = await supabase
    .from("project_members")
    .insert({
      project_id: input.project_id,
      user_id: profile.id,
      role: input.role,
    });

  if (error) throw new Error(`Failed to invite member: ${error.message}`);

  return { invited: true, user: profile, role: input.role };
}
