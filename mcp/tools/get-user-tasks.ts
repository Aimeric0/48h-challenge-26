import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const getUserTasksSchema = z.object({
  user_id: z.string().describe("ID of the user"),
  status: z
    .enum(["todo", "in_progress", "done"])
    .optional()
    .describe("Filter by task status"),
});

export async function getUserTasks(input: z.infer<typeof getUserTasksSchema>) {
  let query = supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("assignee_id", input.user_id)
    .order("deadline", { ascending: true });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get user tasks: ${error.message}`);

  return data ?? [];
}
