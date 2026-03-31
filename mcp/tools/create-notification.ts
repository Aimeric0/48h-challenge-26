import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { sendTaskUpdateNotification } from "../../src/lib/email.js";

export const createNotificationSchema = z.object({
  user_id: z.string().describe("ID of the user to notify"),
  type: z.enum(["task_updated", "task_assigned", "project_invite", "task_completed"]).describe("Type of notification"),
  title: z.string().describe("Notification title"),
  message: z.string().describe("Notification message"),
  data: z.record(z.string(), z.any()).optional().describe("Additional data for the notification"),
  send_email: z.boolean().optional().default(false).describe("Whether to also send an email notification"),
});

export async function createNotification(input: z.infer<typeof createNotificationSchema>) {
  const supabase = await getSupabase();

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create notification: ${error.message}`);

  // Send email if requested and it's a task-related notification
  if (input.send_email && (input.type === 'task_updated' || input.type === 'task_assigned' || input.type === 'task_completed')) {
    try {
      // Get user's email
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", input.user_id)
        .single();

      if (!userError && user?.email) {
        // For task notifications, we need project and task info
        const projectName = (input.data?.project_name as string) || 'Unknown Project';
        const taskTitle = (input.data?.task_title as string) || 'Unknown Task';
        const changesData = input.data?.changes;
        const changes = Array.isArray(changesData) ? changesData : [input.message];

        await sendTaskUpdateNotification(
          user.email,
          taskTitle,
          projectName,
          changes as string[]
        );
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the notification creation if email fails
    }
  }

  return notification;
}

