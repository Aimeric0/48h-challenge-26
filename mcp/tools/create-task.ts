import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const createTaskSchema = z.object({
  project_id: z.string().describe("ID of the project to create the task in"),
  title: z.string().describe("Title of the task"),
  description: z.string().optional().describe("Detailed description of the task"),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo").describe("Task status"),
  assignee_id: z.string().optional().describe("User ID of the person assigned to this task"),
  deadline: z.string().optional().describe("Deadline in ISO 8601 format (e.g. 2026-04-01T00:00:00Z)"),
});

export async function createTask(input: z.infer<typeof createTaskSchema>) {
  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", input.project_id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (existing?.position ?? -1) + 1;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      assignee_id: input.assignee_id ?? null,
      deadline: input.deadline ?? null,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return task;
}
