import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    const [{ data: profile }, { data: memberships }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, avatar_url, xp, level, created_at, updated_at").eq("id", userId).single(),
      supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId),
    ]);

    const projectIds = (memberships || []).map((m) => m.project_id);

    const [{ data: projects }, { data: tasks }] = await Promise.all([
      projectIds.length > 0
        ? supabase
            .from("projects")
            .select("id, name, description, status, deadline, owner_id, created_at, updated_at")
            .in("id", projectIds)
            .order("created_at", { ascending: true })
            .limit(500)
        : { data: [] as Record<string, unknown>[] },
      projectIds.length > 0
        ? supabase
            .from("tasks")
            .select("id, project_id, title, description, status, assignee_id, deadline, position, created_at, updated_at")
            .in("project_id", projectIds)
            .order("created_at", { ascending: true })
            .limit(5000)
        : { data: [] as Record<string, unknown>[] },
    ]);

    // Group tasks by project_id in O(n) instead of O(n*m) filter
    const tasksByProject = new Map<string, Record<string, unknown>[]>();
    for (const task of tasks || []) {
      const pid = task.project_id as string;
      if (!tasksByProject.has(pid)) tasksByProject.set(pid, []);
      tasksByProject.get(pid)!.push(task);
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      profile,
      projects: (projects || []).map((project) => ({
        ...project,
        tasks: tasksByProject.get(project.id as string) || [],
      })),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="mes-donnees.json"',
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
