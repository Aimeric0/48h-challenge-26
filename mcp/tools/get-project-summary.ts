import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const getProjectSummarySchema = z.object({
  project_id: z.string().describe("ID of the project to summarize"),
});

export async function getProjectSummary(input: z.infer<typeof getProjectSummarySchema>) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", input.project_id)
    .single();

  if (projectError || !project) throw new Error(`Project not found: ${input.project_id}`);

  const [membersResult, tasksResult] = await Promise.all([
    supabase.from("project_members").select("project_id, user_id, role, joined_at").eq("project_id", input.project_id),
    supabase.from("tasks").select("*").eq("project_id", input.project_id).order("position", { ascending: true }),
  ]);

  const members = membersResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const userIds = [
    ...new Set([
      ...members.map((m) => m.user_id),
      ...tasks.filter((t) => t.assignee_id).map((t) => t.assignee_id!),
    ]),
  ];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const now = new Date().toISOString();

  const enrichedMembers = members.map((m) => ({ ...m, profile: profileMap.get(m.user_id) ?? null }));
  const enrichedTasks = tasks.map((t) => ({ ...t, assignee: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null }));

  const doneTasks = tasks.filter((t) => t.status === "done");
  const overdueTasks = tasks.filter((t) => t.deadline && t.deadline < now && t.status !== "done");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");

  return {
    ...project,
    task_count: tasks.length,
    done_count: doneTasks.length,
    in_progress_count: inProgressTasks.length,
    todo_count: tasks.filter((t) => t.status === "todo").length,
    overdue_count: overdueTasks.length,
    completion_percentage: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
    members: enrichedMembers,
    tasks: enrichedTasks,
  };
}
