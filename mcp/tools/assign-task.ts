import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const assignTaskSchema = z.object({
  task_id: z.string().describe("ID of the task to assign"),
  assignee_id: z.string().nullable().describe("User ID to assign the task to, or null to unassign"),
});

export async function assignTask(input: z.infer<typeof assignTaskSchema>) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .update({ assignee_id: input.assignee_id, updated_at: new Date().toISOString() })
    .eq("id", input.task_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to assign task: ${error.message}`);

  return data;
}
