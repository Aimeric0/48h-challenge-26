import { z } from "zod";
import { supabase } from "../lib/supabase.js";

export const getProjectStatsSchema = z.object({
  project_id: z.string().describe("ID of the project"),
});

export async function getProjectStats(input: z.infer<typeof getProjectStatsSchema>) {
  const now = new Date();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("status, deadline, created_at, updated_at")
    .eq("project_id", input.project_id);

  if (error) throw new Error(`Failed to get project stats: ${error.message}`);
  if (!tasks?.length) {
    return {
      total_tasks: 0,
      todo: 0,
      in_progress: 0,
      done: 0,
      completion_rate: 0,
      overdue: 0,
      weekly_velocity: [],
    };
  }

  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(
    (t) => t.deadline && t.deadline < now.toISOString() && t.status !== "done"
  ).length;

  // Calculate weekly velocity (tasks completed per week over last 4 weeks)
  const weeklyVelocity: { week: string; completed: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const completed = tasks.filter(
      (t) =>
        t.status === "done" &&
        t.updated_at &&
        t.updated_at >= weekStart.toISOString() &&
        t.updated_at < weekEnd.toISOString()
    ).length;

    weeklyVelocity.push({
      week: `${weekStart.toISOString().slice(0, 10)} → ${weekEnd.toISOString().slice(0, 10)}`,
      completed,
    });
  }

  return {
    total_tasks: tasks.length,
    todo,
    in_progress: inProgress,
    done,
    completion_rate: Math.round((done / tasks.length) * 100),
    overdue,
    weekly_velocity: weeklyVelocity.reverse(),
  };
}
