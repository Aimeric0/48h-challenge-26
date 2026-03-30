import { supabase } from "../lib/supabase.js";

export async function buildRetrospectivePrompt(projectId: string, sprintName?: string): Promise<string> {
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, status, assignee_id, deadline, updated_at")
    .eq("project_id", projectId);

  const allTasks = tasks ?? [];
  const done = allTasks.filter((t) => t.status === "done");
  const inProgress = allTasks.filter((t) => t.status === "in_progress");
  const now = new Date().toISOString();
  const overdue = allTasks.filter(
    (t) => t.deadline && t.deadline < now && t.status !== "done"
  );

  const lines: string[] = [
    `# Rétrospective${sprintName ? ` — ${sprintName}` : ""}`,
    `**Projet :** ${project?.name ?? projectId}`,
    `**Date :** ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    `## Résumé`,
    `- Tâches terminées : ${done.length}/${allTasks.length}`,
    `- En cours : ${inProgress.length}`,
    `- En retard : ${overdue.length}`,
    "",
    "## ✅ Ce qui a bien fonctionné",
    "<!-- Listez les points positifs du sprint -->",
    ...done.map((t) => `- [DONE] ${t.title}`),
    "",
    "## ⚠️ Problèmes rencontrés",
    "<!-- Listez les difficultés et blocages -->",
    ...overdue.map((t) => `- [OVERDUE] ${t.title} (deadline: ${t.deadline})`),
    "",
    "## 🔄 Actions d'amélioration",
    "<!-- Proposez des actions concrètes pour le prochain sprint -->",
    "- ",
    "",
  ];

  return lines.join("\n");
}
