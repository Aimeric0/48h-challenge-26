import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FolderCheck, Flame, CalendarCheck, Loader2 } from "lucide-react";
import { XpBar } from "@/components/gamification/xp-bar";
import { BadgesGrid } from "@/components/gamification/badges-grid";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";

export const dynamic = "force-dynamic";

async function DashboardStats({ userId, profileXp, profileLevel }: { userId: string; profileXp: number; profileLevel: number }) {
  const supabase = await createClient();

  let tasksCompleted = 0;
  let projectsCompleted = 0;
  let projectsCreated = 0;
  let membersInvited = 0;
  let tasksAssigned = 0;
  let streak = 0;
  let badgeUnlockDates: Record<string, string> = {};
  let activityRaw: { activity_date: string }[] = [];

  try {
    // Pre-fetch owned project IDs to avoid waterfall inside Promise.all
    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId);
    const ownedProjectIds = ownedProjects?.map((p) => p.id) || [];

    const sixteenWeeksAgo = new Date();
    sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - 112);

    const [
      tasksRes,
      projectsRes,
      createdRes,
      invitedRes,
      assignedRes,
      streakRes,
      badgesRes,
      activityRes,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assignee_id", userId)
        .eq("status", "done"),
      supabase
        .from("projects")
        .select("id, project_members!inner(user_id)", { count: "exact", head: true })
        .eq("status", "completed")
        .eq("project_members.user_id", userId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      ownedProjectIds.length > 0
        ? supabase
            .from("project_members")
            .select("id", { count: "exact", head: true })
            .eq("role", "member")
            .in("project_id", ownedProjectIds)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assignee_id", userId),
      supabase.rpc("get_user_streak", { p_user_id: userId }),
      supabase.rpc("sync_user_badges", { p_user_id: userId }),
      supabase
        .from("activity_log")
        .select("activity_date")
        .eq("user_id", userId)
        .gte("activity_date", sixteenWeeksAgo.toISOString().split("T")[0]),
    ]);

    tasksCompleted = tasksRes.count ?? 0;
    projectsCompleted = projectsRes.count ?? 0;
    projectsCreated = createdRes.count ?? 0;
    membersInvited = invitedRes.count ?? 0;
    tasksAssigned = assignedRes.count ?? 0;
    streak = streakRes.data ?? 0;
    activityRaw = activityRes.data || [];

    for (const b of badgesRes.data || []) {
      badgeUnlockDates[b.badge_id] = b.unlocked_at;
    }
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
    <>
      <BadgesGrid
        stats={{
          tasksCompleted,
          projectsCompleted,
          level: profileLevel,
          totalXp: profileXp,
          projectsCreated,
          membersInvited,
          tasksAssigned,
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
            <p className="text-2xl font-bold mt-1">{tasksCompleted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">+10 XP par tâche</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projets terminés</span>
              <FolderCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-1">{projectsCompleted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">+50 XP par projet</p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">XP Total</span>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{profileXp}</p>
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

      <ActivityHeatmap data={activityData} />
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-none">
            <CardContent className="py-4 px-4">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-12 rounded bg-muted animate-pulse mt-2" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, xp, level")
    .eq("id", userId)
    .single();

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

      {/* Stats, Badges, Heatmap - streamed via Suspense */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={userId!} profileXp={profile?.xp ?? 0} profileLevel={profile?.level ?? 1} />
      </Suspense>
    </div>
  );
}
