import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, CheckCircle2, FolderCheck, Flame } from "lucide-react";
import Link from "next/link";
import { XpBar } from "@/components/xp-bar";
import { BadgesGrid } from "@/components/badges-grid";

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

  // Fetch all stats in parallel
  const [
    { count: tasksCompleted },
    { count: projectsCompleted },
    { count: projectsCreated },
    { count: membersInvited },
    { count: tasksAssigned },
    { data: streakData },
    { data: userBadges },
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

  const streak = streakData ?? 0;

  const badgeUnlockDates: Record<string, string> = {};
  for (const b of userBadges || []) {
    badgeUnlockDates[b.badge_id] = b.unlocked_at;
  }

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

        <Link href="/dashboard/settings">
          <Card className="shadow-none transition-colors hover:bg-accent/50 cursor-pointer h-full">
            <CardContent className="py-4 px-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paramètres</span>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Gérer votre compte
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
