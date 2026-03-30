import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const listMembersSchema = z.object({
  project_id: z.string().describe("ID of the project"),
});

export async function listMembers(input: z.infer<typeof listMembersSchema>) {
  const supabase = await getSupabase();
  const { data: members, error } = await supabase
    .from("project_members")
    .select("user_id, role, joined_at")
    .eq("project_id", input.project_id);

  if (error) throw new Error(`Failed to list members: ${error.message}`);
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) ?? null,
  }));
}
