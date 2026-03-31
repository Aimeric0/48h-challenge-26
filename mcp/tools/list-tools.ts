import { z } from "zod";

export const listToolsSchema = z.object({});

export interface ToolInfo {
  name: string;
  description: string;
}

export async function listTools(): Promise<ToolInfo[]> {
  return [
    {
      name: "list_projects",
      description: "List all projects, optionally filtered by user ID",
    },
    {
      name: "create_project",
      description: "Create a new project with a name, optional description and deadline",
    },
    {
      name: "list_tasks",
      description: "List tasks for a project, optionally filtered by status",
    },
    {
      name: "create_task",
      description: "Create a new task in a project",
    },
    {
      name: "update_task",
      description: "Update an existing task (partial update supported)",
    },
    {
      name: "delete_task",
      description: "Delete a task by its ID",
    },
    {
      name: "assign_task",
      description: "Assign or reassign a task to a user, or unassign by passing null",
    },
    {
      name: "get_project_summary",
      description: "Get a full summary of a project including tasks, members, and completion stats",
    },
    {
      name: "get_project_stats",
      description: "Get project statistics: completion rate, overdue count, and weekly velocity over the last 4 weeks",
    },
    {
      name: "list_members",
      description: "List all members of a project with their profiles and roles",
    },
    {
      name: "invite_member",
      description: "Invite a user to a project by their email address",
    },
    {
      name: "get_overdue_tasks",
      description: "Get all overdue tasks, optionally filtered by project",
    },
    {
      name: "get_user_tasks",
      description: "Get all tasks assigned to a specific user, optionally filtered by status",
    },
    {
      name: "get_user_by_email",
      description: "Look up a user by their email address and return their ID, name, and email",
    },
    {
      name: "get_current_user",
      description: "Get the currently authenticated MCP user's ID, email, and name",
    },
    {
      name: "update_profile",
      description: "Update a user's profile (first name and/or last name)",
    },
  ];
}
