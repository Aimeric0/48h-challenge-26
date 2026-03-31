import { getSupabase } from "../lib/supabase.js";

export async function getUserProjectsResource(userId: string): Promise<string> {
  const supabase = await getSupabase();

  const { data: memberProjects } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  const projectIds = memberProjects?.map((m) => m.project_id) ?? [];
  if (projectIds.length === 0) return JSON.stringify([], null, 2);

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

  const now = new Date().toISOString();

  const [membersResult, tasksResult] = await Promise.all([
    supabase.from("project_members").select("project_id, user_id, role").in("project_id", projectIds),
    supabase.from("tasks").select("project_id, status, deadline").in("project_id", projectIds),
  ]);

  const members = membersResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const result = (projects ?? []).map((project) => {
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

  return JSON.stringify(result, null, 2);
}
