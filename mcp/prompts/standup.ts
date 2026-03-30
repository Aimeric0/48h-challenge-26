import { supabase } from "../lib/supabase.js";

export async function buildStandupPrompt(projectId: string, userName?: string): Promise<string> {
  const { data: project } = await supabase
    .from("projects")
    .select("name, description, status, deadline")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error(`Project not found: ${projectId}`);

  const now = new Date().toISOString();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, status, deadline, assignee_id")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const allTasks = tasks ?? [];
  const inProgress = allTasks.filter((t) => t.status === "in_progress");
  const overdue = allTasks.filter((t) => t.deadline && t.deadline < now && t.status !== "done");
  const done = allTasks.filter((t) => t.status === "done");
  const todo = allTasks.filter((t) => t.status === "todo");

  const formatList = (items: { title: string }[]) =>
    items.length > 0 ? items.map((t) => `  - ${t.title}`).join("\n") : "  - Aucune";

  return `# Template Daily Standup — ${project.name}${userName ? ` (${userName})` : ""}

**Projet :** ${project.name}
**Statut :** ${project.status}${project.deadline ? `\n**Deadline :** ${new Date(project.deadline).toLocaleDateString("fr-FR")}` : ""}

---

## Ce que j'ai fait hier
<!-- Décris les tâches terminées ou avancées hier -->

## Ce que je fais aujourd'hui
<!-- Décris les tâches sur lesquelles tu vas travailler aujourd'hui -->

## Blocages / Impediments
<!-- Mentionne tout ce qui t'empêche d'avancer -->

---

## Contexte du projet

**En cours (${inProgress.length}) :**
${formatList(inProgress)}

**À faire (${todo.length}) :**
${formatList(todo)}

**En retard (${overdue.length}) :**
${formatList(overdue)}

**Terminées (${done.length}/${allTasks.length}) :**
${formatList(done)}

---
*Généré automatiquement — ${new Date().toLocaleDateString("fr-FR")}*`;
}
