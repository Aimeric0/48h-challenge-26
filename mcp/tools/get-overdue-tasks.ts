import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const getOverdueTasksSchema = z.object({
  project_id: z.string().optional().describe("Filter by project ID (optional, returns all if omitted)"),
});

export async function getOverdueTasks(input: z.infer<typeof getOverdueTasksSchema>) {
  const supabase = await getSupabase();
  const now = new Date().toISOString();

  let query = supabase
    .from("tasks")
    .select("*, projects(name)")
    .lt("deadline", now)
    .neq("status", "done")
    .order("deadline", { ascending: true });

  if (input.project_id) {
    query = query.eq("project_id", input.project_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get overdue tasks: ${error.message}`);

  return data ?? [];
}
