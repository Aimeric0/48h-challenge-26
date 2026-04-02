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
      supabase.from("profiles").select("*").eq("id", userId).single(),
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
            .select("*")
            .in("id", projectIds)
            .order("created_at", { ascending: true })
        : { data: [] as Record<string, unknown>[] },
      projectIds.length > 0
        ? supabase
            .from("tasks")
            .select("*")
            .in("project_id", projectIds)
            .order("created_at", { ascending: true })
        : { data: [] as Record<string, unknown>[] },
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile,
      projects: (projects || []).map((project) => ({
        ...project,
        tasks: (tasks || []).filter(
          (t) => t.project_id === project.id
        ),
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
