import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { sendTaskUpdateNotification } from "../../src/lib/email.js";
import { createNotification } from "./create-notification.js";

export const updateTaskSchema = z.object({
  task_id: z.string().describe("ID of the task to update"),
  title: z.string().optional().describe("New title for the task"),
  description: z.string().optional().describe("New description for the task"),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional().describe("New status for the task"),
  assignee_id: z.string().nullable().optional().describe("User ID to assign the task to, or null to unassign"),
  deadline: z.string().nullable().optional().describe("New deadline in ISO 8601 format, or null to remove"),
});

export async function updateTask(input: z.infer<typeof updateTaskSchema>) {
  const supabase = await getSupabase();
  const { task_id, ...fields } = input;

  // Get the current task and project info before updating
  const { data: currentTask, error: fetchError } = await supabase
    .from("tasks")
    .select(`
      *,
      projects (
        name
      )
    `)
    .eq("id", task_id)
    .single();

  if (fetchError) throw new Error(`Failed to fetch task: ${fetchError.message}`);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.description !== undefined) updates.description = fields.description;
  if (fields.status !== undefined) updates.status = fields.status;
  if (fields.assignee_id !== undefined) updates.assignee_id = fields.assignee_id;
  if (fields.deadline !== undefined) updates.deadline = fields.deadline;

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", task_id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update task: ${error.message}`);

  // Send notification email if there are changes and assignee exists
  if (task.assignee_id) {
    try {
      const changes = [];
      if (fields.title !== undefined && fields.title !== currentTask.title) {
        changes.push(`Title changed from "${currentTask.title}" to "${fields.title}"`);
      }
      if (fields.description !== undefined && fields.description !== currentTask.description) {
        changes.push(`Description updated`);
      }
      if (fields.status !== undefined && fields.status !== currentTask.status) {
        changes.push(`Status changed from "${currentTask.status}" to "${fields.status}"`);
      }
      if (fields.assignee_id !== undefined && fields.assignee_id !== currentTask.assignee_id) {
        changes.push(`Assignee changed`);
      }
      if (fields.deadline !== undefined && fields.deadline !== currentTask.deadline) {
        changes.push(`Deadline changed to ${fields.deadline || 'none'}`);
      }

      if (changes.length > 0) {
        // Get assignee's email
        const { data: assignee, error: emailError } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", task.assignee_id)
          .single();

        if (!emailError && assignee?.email) {
          // Send email notification
          await sendTaskUpdateNotification(
            assignee.email,
            task.title,
            currentTask.projects.name,
            changes
          );

          // Create in-app notification
          await createNotification({
            user_id: task.assignee_id,
            type: "task_updated",
            title: `Task Updated: ${task.title}`,
            message: `Your task "${task.title}" in project "${currentTask.projects.name}" has been updated.`,
            data: {
              task_id: task_id,
              project_name: currentTask.projects.name,
              task_title: task.title,
              changes: changes
            },
            send_email: false // Already sent above
          });
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the task update
      console.error("Failed to send notification email:", emailError);
    }
  }

  return task;
}
