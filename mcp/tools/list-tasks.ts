import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const listTasksSchema = z.object({
  project_id: z.string().describe("ID of the project to list tasks for"),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional().describe("Filter by task status"),
});

export async function listTasks(input: z.infer<typeof listTasksSchema>) {
  const supabase = await getSupabase();
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("project_id", input.project_id)
    .order("position", { ascending: true });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data: tasks, error } = await query;
  if (error) throw new Error(`Failed to list tasks: ${error.message}`);
  if (!tasks?.length) return [];

  const assigneeIds = [...new Set(tasks.filter((t) => t.assignee_id).map((t) => t.assignee_id!))];
  const { data: profiles } = assigneeIds.length
    ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", assigneeIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return tasks.map((task) => ({
    ...task,
    assignee: task.assignee_id ? profileMap.get(task.assignee_id) ?? null : null,
  }));
}
