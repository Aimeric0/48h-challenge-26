import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const getUserGamificationSchema = z.object({
  user_id: z.string().optional().describe("User ID to look up. If omitted, returns the current user's gamification profile."),
});

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

function getLevelTitle(level: number): string {
  if (level >= 20) return "Architecte";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Senior";
  if (level >= 7) return "Confirmé";
  if (level >= 5) return "Intermédiaire";
  if (level >= 3) return "Junior";
  return "Débutant";
}

function xpForNextLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += i * 50;
  }
  return total;
}

function computeBadges(tasksCompleted: number, projectsCompleted: number, level: number): BadgeDef[] {
  return [
    { id: "first_task", name: "Premier pas", description: "Terminer sa première tâche", unlocked: tasksCompleted >= 1 },
    { id: "ten_tasks", name: "Productif", description: "Terminer 10 tâches", unlocked: tasksCompleted >= 10 },
    { id: "first_project", name: "Chef de projet", description: "Terminer un projet", unlocked: projectsCompleted >= 1 },
    { id: "level_5", name: "Confirmé", description: "Atteindre le niveau 5", unlocked: level >= 5 },
    { id: "level_10", name: "Vétéran", description: "Atteindre le niveau 10", unlocked: level >= 10 },
  ];
}

export async function getUserGamification(input: z.infer<typeof getUserGamificationSchema>) {
  const supabase = await getSupabase();

  let userId = input.user_id;
  if (!userId) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Not authenticated");
    userId = user.id;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, xp, level")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(`User not found: ${profileError?.message ?? "unknown"}`);
  }

  const { count: tasksCompleted } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assignee_id", userId)
    .eq("status", "done");

  const { count: projectsCompleted } = await supabase
    .from("projects")
    .select("*, project_members!inner(user_id)", { count: "exact", head: true })
    .eq("status", "completed")
    .eq("project_members.user_id", userId);

  const badges = computeBadges(tasksCompleted ?? 0, projectsCompleted ?? 0, profile.level);

  return {
    user: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
    },
    level: {
      current: profile.level,
      title: getLevelTitle(profile.level),
      xp: profile.xp,
      xp_next_level: xpForNextLevel(profile.level),
    },
    badges,
    badges_unlocked: badges.filter((b) => b.unlocked).length,
    badges_total: badges.length,
  };
}
