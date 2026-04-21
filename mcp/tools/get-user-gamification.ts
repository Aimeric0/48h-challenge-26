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

function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

interface BadgeStats {
  tasksCompleted: number;
  projectsCompleted: number;
  projectsCreated: number;
  membersInvited: number;
  level: number;
  xp: number;
  streak: number;
  hasNightOwlTask: boolean;
  hasGhostBusterTask: boolean;
}

function computeBadges(s: BadgeStats): BadgeDef[] {
  return [
    { id: "first_task", name: "Premier pas", description: "Terminer sa première tâche", unlocked: s.tasksCompleted >= 1 },
    { id: "ten_tasks", name: "Productif", description: "Terminer 10 tâches", unlocked: s.tasksCompleted >= 10 },
    { id: "fifty_tasks", name: "Machine", description: "Terminer 50 tâches", unlocked: s.tasksCompleted >= 50 },
    { id: "first_project", name: "Chef de projet", description: "Terminer un projet", unlocked: s.projectsCompleted >= 1 },
    { id: "three_projects_created", name: "Organisateur", description: "Créer 3 projets", unlocked: s.projectsCreated >= 3 },
    { id: "first_invite", name: "Collaborateur", description: "Inviter un membre dans un projet", unlocked: s.membersInvited >= 1 },
    { id: "five_invites", name: "Recruteur", description: "Inviter 5 membres", unlocked: s.membersInvited >= 5 },
    { id: "level_5", name: "Confirmé", description: "Atteindre le niveau 5", unlocked: s.level >= 5 },
    { id: "level_10", name: "Vétéran", description: "Atteindre le niveau 10", unlocked: s.level >= 10 },
    { id: "xp_500", name: "Marathonien", description: "Accumuler 500 XP", unlocked: s.xp >= 500 },
    { id: "streak_3", name: "Régulier", description: "3 jours d'activité consécutifs", unlocked: s.streak >= 3 },
    { id: "streak_7", name: "Assidu", description: "7 jours d'activité consécutifs", unlocked: s.streak >= 7 },
    { id: "night_owl", name: "Noctambule", description: "Terminer une tâche entre 2h et 5h du matin", unlocked: s.hasNightOwlTask },
    { id: "ghost_buster", name: "Chasseur de fantômes", description: "Terminer une tâche créée il y a plus de 90 jours", unlocked: s.hasGhostBusterTask },
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

  const [
    { count: tasksCompleted },
    { count: projectsCompleted },
    { count: projectsCreated },
    { data: streakData },
    { data: nightOwlData },
    { data: ghostBusterData },
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
      .eq("project_members.user_id", userId),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase.rpc("get_user_streak", { p_user_id: userId }),
    supabase.rpc("check_night_owl", { p_user_id: userId }),
    supabase.rpc("check_ghost_buster", { p_user_id: userId }),
  ]);

  // Count invited members from owned projects
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", userId);
  const ownedIds = ownedProjects?.map((p: { id: string }) => p.id) || [];
  let membersInvited = 0;
  if (ownedIds.length > 0) {
    const { count } = await supabase
      .from("project_members")
      .select("*", { count: "exact", head: true })
      .eq("role", "member")
      .in("project_id", ownedIds);
    membersInvited = count ?? 0;
  }

  const streak = streakData ?? 0;
  const badges = computeBadges({
    tasksCompleted: tasksCompleted ?? 0,
    projectsCompleted: projectsCompleted ?? 0,
    projectsCreated: projectsCreated ?? 0,
    membersInvited,
    level: profile.level,
    xp: profile.xp,
    streak,
    hasNightOwlTask: nightOwlData ?? false,
    hasGhostBusterTask: ghostBusterData ?? false,
  });

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
    streak: {
      current: streak,
      multiplier: getStreakMultiplier(streak),
    },
    badges,
    badges_unlocked: badges.filter((b) => b.unlocked).length,
    badges_total: badges.length,
  };
}
