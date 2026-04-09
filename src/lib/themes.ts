export const COLOR_THEMES = [
  { id: "default", name: "Défaut", color: "#09090b", darkColor: "#fafafa", category: "basic" as const },
  { id: "blue", name: "Classique", color: "#2563eb", darkColor: "#3b82f6", category: "basic" as const },
  { id: "violet", name: "Améthyste", color: "#7c3aed", darkColor: "#8b5cf6", category: "basic" as const },
  { id: "green", name: "Jade", color: "#059669", darkColor: "#10b981", category: "basic" as const },
  { id: "orange", name: "Automne", color: "#ea580c", darkColor: "#f97316", category: "basic" as const },
  { id: "rose", name: "Sakura", color: "#db2777", darkColor: "#ec4899", category: "basic" as const },
  { id: "yellow", name: "Poussin", color: "#ca8a04", darkColor: "#eab308", category: "basic" as const },
  {
    id: "charte",
    name: "Charte graphique",
    color: "#8B5CF6",
    darkColor: "#A78BFA",
    category: "advanced" as const,
    description: "Palette officielle du Challenge 48h",
    palette: ["#8B5CF6", "#F59E0B", "#EC4899"],
  },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];
