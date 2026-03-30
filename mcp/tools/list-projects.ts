import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const listProjectsSchema = z.object({
  user_id: z.string().optional().describe("Filter projects by owner or member user ID"),
});

export async function listProjects(input: z.infer<typeof listProjectsSchema>) {
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });

  if (input.user_id) {
    const { data: memberProjects } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", input.user_id);

    const projectIds = memberProjects?.map((m) => m.project_id) ?? [];
    if (projectIds.length === 0) return [];

    query = query.in("id", projectIds);
  }

  const { data: projects, error } = await query;
  if (error) throw new Error(`Failed to list projects: ${error.message}`);
  if (!projects?.length) return [];

  const projectIds = projects.map((p) => p.id);
  const now = new Date().toISOString();

  const [membersResult, tasksResult] = await Promise.all([
    supabase.from("project_members").select("project_id, user_id, role").in("project_id", projectIds),
    supabase.from("tasks").select("project_id, status, deadline").in("project_id", projectIds),
  ]);

  const members = membersResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    return {
      ...project,
      task_count: projectTasks.length,
      done_count: projectTasks.filter((t) => t.status === "done").length,
      overdue_count: projectTasks.filter(
        (t) => t.deadline && t.deadline < now && t.status !== "done"
      ).length,
      member_count: members.filter((m) => m.project_id === project.id).length,
    };
  });
}
