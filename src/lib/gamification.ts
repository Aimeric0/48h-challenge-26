// XP thresholds mirror the SQL calculate_level function
// Level n requires cumulative sum of (i * 50) for i in 1..n-1

export function xpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += i * 50;
  }
  return total;
}

export function xpForNextLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += i * 50;
  }
  return total;
}

export function getLevelProgress(xp: number, level: number): number {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 100;
  return Math.round(((xp - currentLevelXp) / range) * 100);
}

export function getLevelTitle(level: number): string {
  if (level >= 20) return "Architecte";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Senior";
  if (level >= 7) return "Confirmé";
  if (level >= 5) return "Intermédiaire";
  if (level >= 3) return "Junior";
  return "Débutant";
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

export function getNextMultiplierThreshold(streak: number): { days: number; multiplier: number } | null {
  if (streak >= 14) return null;
  if (streak >= 7) return { days: 14, multiplier: 2.0 };
  if (streak >= 3) return { days: 7, multiplier: 1.5 };
  return { days: 3, multiplier: 1.2 };
}
