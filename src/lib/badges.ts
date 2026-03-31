export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  tasksCompleted: number;
  projectsCompleted: number;
  level: number;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first_task",
    name: "Premier pas",
    description: "Terminer sa première tâche",
    icon: "rocket",
    check: (s) => s.tasksCompleted >= 1,
  },
  {
    id: "ten_tasks",
    name: "Productif",
    description: "Terminer 10 tâches",
    icon: "zap",
    check: (s) => s.tasksCompleted >= 10,
  },
  {
    id: "first_project",
    name: "Chef de projet",
    description: "Terminer un projet",
    icon: "folder-check",
    check: (s) => s.projectsCompleted >= 1,
  },
  {
    id: "level_5",
    name: "Confirmé",
    description: "Atteindre le niveau 5",
    icon: "shield",
    check: (s) => s.level >= 5,
  },
  {
    id: "level_10",
    name: "Vétéran",
    description: "Atteindre le niveau 10",
    icon: "crown",
    check: (s) => s.level >= 10,
  },
];

export function getUnlockedBadges(stats: UserStats): BadgeDef[] {
  return BADGES.filter((b) => b.check(stats));
}
