import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const deleteTaskSchema = z.object({
  task_id: z.string().describe("ID of the task to delete"),
});

export async function deleteTask(input: z.infer<typeof deleteTaskSchema>) {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", input.task_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to delete task: ${error.message}`);

  return { deleted: true, task: data };
}
