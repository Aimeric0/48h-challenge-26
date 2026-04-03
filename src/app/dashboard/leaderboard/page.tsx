import { createClient } from "@/lib/supabase/server";
import { GlobalLeaderboard } from "@/components/gamification/global-leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, xp, level")
    .order("xp", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Classement</h1>
        <p className="text-muted-foreground">
          Les utilisateurs les plus actifs de la plateforme.
        </p>
      </div>

      <GlobalLeaderboard
        users={users || []}
        currentUserId={user?.id}
      />
    </div>
  );
}
