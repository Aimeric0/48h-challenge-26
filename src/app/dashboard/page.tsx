import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FolderCheck, Flame, CalendarCheck } from "lucide-react";
import { XpBar } from "@/components/gamification/xp-bar";
import { BadgesGrid } from "@/components/gamification/badges-grid";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, xp, level")
    .eq("id", userId)
    .single();

  // Fetch all stats in parallel with fallback defaults
  let tasksCompleted = 0;
  let projectsCompleted = 0;
  let projectsCreated = 0;
  let membersInvited = 0;
  let tasksAssigned = 0;
  let streak = 0;
  let badgeUnlockDates: Record<string, string> = {};
  let activityRaw: { activity_date: string }[] = [];

  try {
    const [
      tasksRes,
      projectsRes,
      createdRes,
      invitedRes,
      assignedRes,
      streakRes,
      badgesRes,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assignee_id", userId)
        .eq("status", "done"),
      supabase
        .from("projects")
        .select("*, project_members!inner(user_id)", { count: "exact", head: true })
        .eq("status", "completed")
        .eq("project_members.user_id", userId!),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("role", "member")
        .in("project_id",
          (await supabase.from("projects").select("id").eq("owner_id", userId!))
            .data?.map((p) => p.id) || []
        ),
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assignee_id", userId),
      supabase.rpc("get_user_streak", { p_user_id: userId }),
      supabase.rpc("sync_user_badges", { p_user_id: userId }),
    ]);

    tasksCompleted = tasksRes.count ?? 0;
    projectsCompleted = projectsRes.count ?? 0;
    projectsCreated = createdRes.count ?? 0;
    membersInvited = invitedRes.count ?? 0;
    tasksAssigned = assignedRes.count ?? 0;
    streak = streakRes.data ?? 0;

    for (const b of badgesRes.data || []) {
      badgeUnlockDates[b.badge_id] = b.unlocked_at;
    }

    // Fetch activity data for heatmap (last 16 weeks)
    const sixteenWeeksAgo = new Date();
    sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - 112);
    const { data } = await supabase
      .from("activity_log")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("activity_date", sixteenWeeksAgo.toISOString().split("T")[0]);
    activityRaw = data || [];
  } catch {
    // Fallback to defaults on error
  }

  const activityMap = new Map<string, number>();
  for (const row of activityRaw || []) {
    const date = row.activity_date;
    activityMap.set(date, (activityMap.get(date) ?? 0) + 1);
  }
  const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {profile?.full_name || "utilisateur"} !
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord.
        </p>
      </div>

      {/* XP Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <XpBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </CardContent>
      </Card>

      {/* Badges */}
      <BadgesGrid
        stats={{
          tasksCompleted: tasksCompleted ?? 0,
          projectsCompleted: projectsCompleted ?? 0,
          level: profile?.level ?? 1,
          totalXp: profile?.xp ?? 0,
          projectsCreated: projectsCreated ?? 0,
          membersInvited: membersInvited ?? 0,
          tasksAssigned: tasksAssigned ?? 0,
          streak,
        }}
        unlockDates={badgeUnlockDates}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tâches terminées</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{tasksCompleted ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">+10 XP par tâche</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projets terminés</span>
              <FolderCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-1">{projectsCompleted ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">+50 XP par projet</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">XP Total</span>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{profile?.xp ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">XP accumulés</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Streak</span>
              <CalendarCheck className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {streak} jour{streak !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {streak >= 7 ? "Incroyable !" : streak >= 3 ? "Continuez !" : "Restez actif !"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={activityData} />
    </div>
  );
}
