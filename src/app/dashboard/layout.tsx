import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, xp, level, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      initialUserName={profile?.full_name || user.email || ""}
      initialAvatarUrl={profile?.avatar_url || null}
      initialXp={profile?.xp ?? 0}
      initialLevel={profile?.level ?? 1}
      userId={user.id}
    >
      {children}
    </DashboardShell>
  );
}
