import { getSupabase } from "../lib/supabase.js";

export async function buildTaskBreakdownPrompt(
  projectId: string,
  objective: string
): Promise<string> {
  const supabase = await getSupabase();
  const { data: project } = await supabase
    .from("projects")
    .select("name, description")
    .eq("id", projectId)
    .single();

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("title, status")
    .eq("project_id", projectId);

  const tasks = existingTasks ?? [];

  const lines: string[] = [
    `# Décomposition de tâches`,
    `**Projet :** ${project?.name ?? projectId}`,
    project?.description ? `**Description :** ${project.description}` : "",
    `**Objectif à décomposer :** ${objective}`,
    "",
    "## Tâches existantes dans le projet",
    ...(tasks.length
      ? tasks.map((t) => `- [${t.status.toUpperCase()}] ${t.title}`)
      : ["- Aucune tâche existante"]),
    "",
    "## Consigne",
    "En tenant compte des tâches existantes ci-dessus, décompose l'objectif en sous-tâches concrètes et actionnables.",
    "Pour chaque sous-tâche, indique :",
    "- Un titre clair et concis",
    "- Une estimation de complexité (S / M / L)",
    "- Les dépendances éventuelles avec d'autres tâches",
    "",
    "Formate la réponse en liste numérotée.",
  ];

  return lines.filter(Boolean).join("\n");
}
