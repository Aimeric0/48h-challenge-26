import { createClient } from "@/lib/supabase/server";
import type { ProjectWithStats, ProjectDetail, Profile } from "@/types/database";

export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (!projects?.length) return [];

  const projectIds = projects.map((p) => p.id);

  const [membersResult, tasksResult] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, user_id, role, joined_at")
      .in("project_id", projectIds),
    supabase
      .from("tasks")
      .select("project_id, status, deadline")
      .in("project_id", projectIds),
  ]);

  const members = membersResult.data || [];
  const tasks = tasksResult.data || [];

  const userIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p as Profile])
  );

  const now = new Date().toISOString();

  return projects.map((project): ProjectWithStats => {
    const projectMembers = members
      .filter((m) => m.project_id === project.id)
      .map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) as Profile,
      }));

    const projectTasks = tasks.filter((t) => t.project_id === project.id);

    return {
      ...project,
      task_count: projectTasks.length,
      done_count: projectTasks.filter((t) => t.status === "done").length,
      overdue_count: projectTasks.filter(
        (t) => t.deadline && t.deadline < now && t.status !== "done"
      ).length,
      members: projectMembers,
    };
  });
}

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) return null;

  const [membersResult, tasksResult] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, user_id, role, joined_at")
      .eq("project_id", id),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true }),
  ]);

  const members = membersResult.data || [];
  const tasks = tasksResult.data || [];

  const userIds = [
    ...new Set([
      ...members.map((m) => m.user_id),
      ...tasks.filter((t) => t.assignee_id).map((t) => t.assignee_id!),
    ]),
  ];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p as Profile])
  );

  const now = new Date().toISOString();

  const enrichedMembers = members.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) as Profile,
  }));

  const enrichedTasks = tasks.map((t) => ({
    ...t,
    assignee: t.assignee_id ? profileMap.get(t.assignee_id) || null : null,
  }));

  const doneTasks = tasks.filter((t) => t.status === "done");
  const overdueTasks = tasks.filter(
    (t) => t.deadline && t.deadline < now && t.status !== "done"
  );

  return {
    ...project,
    task_count: tasks.length,
    done_count: doneTasks.length,
    overdue_count: overdueTasks.length,
    members: enrichedMembers,
    tasks: enrichedTasks,
  };
}
