export const COLOR_THEMES = [
  { id: "default", name: "Defaut", color: "#09090b", darkColor: "#fafafa" },
  { id: "blue", name: "Classique", color: "#2563eb", darkColor: "#3b82f6" },
  { id: "violet", name: "Amethyste", color: "#7c3aed", darkColor: "#8b5cf6" },
  { id: "green", name: "Jade", color: "#059669", darkColor: "#10b981" },
  { id: "orange", name: "Automne", color: "#ea580c", darkColor: "#f97316" },
  { id: "rose", name: "Sakura", color: "#db2777", darkColor: "#ec4899" },
  { id: "yellow", name: "Poussin", color: "#ca8a04", darkColor: "#eab308" },
  { id: "charte", name: "Charte graphique", color: "#8B5CF6", darkColor: "#A78BFA" },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];
