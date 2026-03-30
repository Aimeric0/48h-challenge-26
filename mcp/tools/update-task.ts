import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const updateTaskSchema = z.object({
  task_id: z.string().describe("ID of the task to update"),
  title: z.string().optional().describe("New title for the task"),
  description: z.string().optional().describe("New description for the task"),
  status: z.enum(["todo", "in_progress", "done"]).optional().describe("New status for the task"),
  assignee_id: z.string().nullable().optional().describe("User ID to assign the task to, or null to unassign"),
  deadline: z.string().nullable().optional().describe("New deadline in ISO 8601 format, or null to remove"),
});

export async function updateTask(input: z.infer<typeof updateTaskSchema>) {
  const { task_id, ...fields } = input;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.description !== undefined) updates.description = fields.description;
  if (fields.status !== undefined) updates.status = fields.status;
  if (fields.assignee_id !== undefined) updates.assignee_id = fields.assignee_id;
  if (fields.deadline !== undefined) updates.deadline = fields.deadline;

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", task_id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return task;
}
