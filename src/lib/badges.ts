export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** For badges with progress, max target value */
  target?: number;
  /** Field in UserStats used for progress tracking */
  progressKey?: keyof UserStats;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  tasksCompleted: number;
  projectsCompleted: number;
  level: number;
  totalXp: number;
  projectsCreated: number;
  membersInvited: number;
  tasksAssigned: number;
  streak: number;
}

export const BADGES: BadgeDef[] = [
  // --- Tasks ---
  {
    id: "first_task",
    name: "Premier pas",
    description: "Terminer sa première tâche",
    icon: "rocket",
    target: 1,
    progressKey: "tasksCompleted",
    check: (s) => s.tasksCompleted >= 1,
  },
  {
    id: "ten_tasks",
    name: "Productif",
    description: "Terminer 10 tâches",
    icon: "zap",
    target: 10,
    progressKey: "tasksCompleted",
    check: (s) => s.tasksCompleted >= 10,
  },
  {
    id: "fifty_tasks",
    name: "Machine",
    description: "Terminer 50 tâches",
    icon: "cpu",
    target: 50,
    progressKey: "tasksCompleted",
    check: (s) => s.tasksCompleted >= 50,
  },
  // --- Projects ---
  {
    id: "first_project",
    name: "Chef de projet",
    description: "Terminer un projet",
    icon: "folder-check",
    target: 1,
    progressKey: "projectsCompleted",
    check: (s) => s.projectsCompleted >= 1,
  },
  {
    id: "three_projects_created",
    name: "Organisateur",
    description: "Créer 3 projets",
    icon: "briefcase",
    target: 3,
    progressKey: "projectsCreated",
    check: (s) => s.projectsCreated >= 3,
  },
  // --- Collaboration ---
  {
    id: "first_invite",
    name: "Collaborateur",
    description: "Inviter un membre dans un projet",
    icon: "handshake",
    target: 1,
    progressKey: "membersInvited",
    check: (s) => s.membersInvited >= 1,
  },
  {
    id: "five_invites",
    name: "Recruteur",
    description: "Inviter 5 membres",
    icon: "users-round",
    target: 5,
    progressKey: "membersInvited",
    check: (s) => s.membersInvited >= 5,
  },
  // --- Levels & XP ---
  {
    id: "level_5",
    name: "Confirmé",
    description: "Atteindre le niveau 5",
    icon: "shield",
    target: 5,
    progressKey: "level",
    check: (s) => s.level >= 5,
  },
  {
    id: "level_10",
    name: "Vétéran",
    description: "Atteindre le niveau 10",
    icon: "crown",
    target: 10,
    progressKey: "level",
    check: (s) => s.level >= 10,
  },
  {
    id: "xp_500",
    name: "Marathonien",
    description: "Accumuler 500 XP",
    icon: "flame",
    target: 500,
    progressKey: "totalXp",
    check: (s) => s.totalXp >= 500,
  },
  // --- Streaks ---
  {
    id: "streak_3",
    name: "Régulier",
    description: "3 jours d'activité consécutifs",
    icon: "calendar-check",
    target: 3,
    progressKey: "streak",
    check: (s) => s.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Assidu",
    description: "7 jours d'activité consécutifs",
    icon: "calendar-heart",
    target: 7,
    progressKey: "streak",
    check: (s) => s.streak >= 7,
  },
];

export function getUnlockedBadges(stats: UserStats): BadgeDef[] {
  return BADGES.filter((b) => b.check(stats));
}
