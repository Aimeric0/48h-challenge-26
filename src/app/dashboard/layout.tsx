"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { LevelUpDialog } from "@/components/level-up-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<number>(1);
  const userIdRef = useRef<string | null>(null);

  const handleXpUpdate = useCallback((newXp: number, newLevel: number) => {
    setXp((prevXp) => {
      const diff = newXp - prevXp;
      if (diff > 0) {
        toast.success(`+${diff} XP gagné !`, {
          icon: "⭐",
          duration: 3000,
        });
      }
      return newXp;
    });
    setLevel(newLevel);
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
    }
    prevLevelRef.current = newLevel;
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userIdRef.current = user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, xp, level, avatar_url")
        .eq("id", user.id)
        .single();

      setUserName(profile?.full_name || user.email || "");
      setAvatarUrl(profile?.avatar_url || null);
      const profileXp = profile?.xp ?? 0;
      const profileLevel = profile?.level ?? 1;
      setXp(profileXp);
      setLevel(profileLevel);
      prevLevelRef.current = profileLevel;

      // Subscribe to realtime XP/level changes
      const xpChannel = supabase
        .channel("profile-xp")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const newData = payload.new as { xp: number; level: number };
            handleXpUpdate(newData.xp, newData.level);
          }
        )
        .subscribe();

      // Subscribe to new badge unlocks
      const badgeChannel = supabase
        .channel("badge-unlocks")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_badges",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const { badge_id } = payload.new as { badge_id: string };
            const BADGE_NAMES: Record<string, string> = {
              first_task: "Premier pas",
              ten_tasks: "Productif",
              fifty_tasks: "Machine",
              first_project: "Chef de projet",
              three_projects_created: "Organisateur",
              first_invite: "Collaborateur",
              five_invites: "Recruteur",
              level_5: "Confirmé",
              level_10: "Vétéran",
              xp_500: "Marathonien",
              streak_3: "Régulier",
              streak_7: "Assidu",
            };
            toast.success(
              `Badge débloqué : ${BADGE_NAMES[badge_id] || badge_id} !`,
              { icon: "🏆", duration: 5000 }
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(xpChannel);
        supabase.removeChannel(badgeChannel);
      };
    }

    loadProfile();
  }, [handleXpUpdate]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          userName={userName}
          avatarUrl={avatarUrl}
          xp={xp}
          level={level}
        />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>

      {/* Level up dialog */}
      <LevelUpDialog
        open={levelUpLevel !== null}
        onClose={() => setLevelUpLevel(null)}
        newLevel={levelUpLevel ?? 1}
      />
    </div>
  );
}
