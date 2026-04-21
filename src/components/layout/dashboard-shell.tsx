"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { LevelUpDialog } from "@/components/gamification/level-up-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BADGES } from "@/lib/badges";

interface DashboardShellProps {
  children: React.ReactNode;
  initialUserName?: string;
  initialAvatarUrl?: string | null;
  initialXp: number;
  initialLevel: number;
  userId: string;
}

export function DashboardShell({
  children,
  initialUserName,
  initialAvatarUrl,
  initialXp,
  initialLevel,
  userId,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [xp, setXp] = useState(initialXp);
  const [level, setLevel] = useState(initialLevel);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<number>(initialLevel);

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

    const xpChannel = supabase
      .channel(`profile-xp-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as { xp: number; level: number };
          handleXpUpdate(newData.xp, newData.level);
        }
      )
      .subscribe();

    const badgeChannel = supabase
      .channel(`badge-unlocks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { badge_id } = payload.new as { badge_id: string };
          const badgeDef = BADGES.find((b) => b.id === badge_id);
          toast.success(
            `Badge débloqué : ${badgeDef?.name || badge_id} !`,
            { icon: "🏆", duration: 5000 }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
      supabase.removeChannel(badgeChannel);
    };
  }, [userId, handleXpUpdate]);

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
          userName={initialUserName}
          avatarUrl={initialAvatarUrl}
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
