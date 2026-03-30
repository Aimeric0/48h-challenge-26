import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { listProjects, listProjectsSchema } from "./tools/list-projects.js";
import { listTasks, listTasksSchema } from "./tools/list-tasks.js";
import { createTask, createTaskSchema } from "./tools/create-task.js";
import { updateTask, updateTaskSchema } from "./tools/update-task.js";
import { getProjectSummary, getProjectSummarySchema } from "./tools/get-project-summary.js";
import { createProject, createProjectSchema } from "./tools/create-project.js";
import { deleteTask, deleteTaskSchema } from "./tools/delete-task.js";
import { assignTask, assignTaskSchema } from "./tools/assign-task.js";
import { listMembers, listMembersSchema } from "./tools/list-members.js";
import { inviteMember, inviteMemberSchema } from "./tools/invite-member.js";
import { getOverdueTasks, getOverdueTasksSchema } from "./tools/get-overdue-tasks.js";
import { getUserTasks, getUserTasksSchema } from "./tools/get-user-tasks.js";
import { getProjectStats, getProjectStatsSchema } from "./tools/get-project-stats.js";
import { getUserByEmail, getUserByEmailSchema } from "./tools/get-user-by-email.js";
import { getProjectResource } from "./resources/project-resource.js";
import { buildStandupPrompt } from "./prompts/standup.js";
import { buildRetrospectivePrompt } from "./prompts/retrospective.js";
import { buildTaskBreakdownPrompt } from "./prompts/task-breakdown.js";

const server = new McpServer({
  name: "challenge48h-mcp",
  version: "1.0.0",
});

// --- Tools ---

server.tool(
  "list_projects",
  "List all projects, optionally filtered by user ID",
  listProjectsSchema.shape,
  async (input) => {
    const result = await listProjects(input as z.infer<typeof listProjectsSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "list_tasks",
  "List tasks for a project, optionally filtered by status",
  listTasksSchema.shape,
  async (input) => {
    const result = await listTasks(input as z.infer<typeof listTasksSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "create_task",
  "Create a new task in a project",
  createTaskSchema.shape,
  async (input) => {
    const result = await createTask(input as z.infer<typeof createTaskSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "update_task",
  "Update an existing task (partial update supported)",
  updateTaskSchema.shape,
  async (input) => {
    const result = await updateTask(input as z.infer<typeof updateTaskSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_project_summary",
  "Get a full summary of a project including tasks, members, and completion stats",
  getProjectSummarySchema.shape,
  async (input) => {
    const result = await getProjectSummary(input as z.infer<typeof getProjectSummarySchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "create_project",
  "Create a new project with a name, optional description and deadline",
  createProjectSchema.shape,
  async (input) => {
    const result = await createProject(input as z.infer<typeof createProjectSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "delete_task",
  "Delete a task by its ID",
  deleteTaskSchema.shape,
  async (input) => {
    const result = await deleteTask(input as z.infer<typeof deleteTaskSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "assign_task",
  "Assign or reassign a task to a user, or unassign by passing null",
  assignTaskSchema.shape,
  async (input) => {
    const result = await assignTask(input as z.infer<typeof assignTaskSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "list_members",
  "List all members of a project with their profiles and roles",
  listMembersSchema.shape,
  async (input) => {
    const result = await listMembers(input as z.infer<typeof listMembersSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "invite_member",
  "Invite a user to a project by their email address",
  inviteMemberSchema.shape,
  async (input) => {
    const result = await inviteMember(input as z.infer<typeof inviteMemberSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_overdue_tasks",
  "Get all overdue tasks, optionally filtered by project",
  getOverdueTasksSchema.shape,
  async (input) => {
    const result = await getOverdueTasks(input as z.infer<typeof getOverdueTasksSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_user_tasks",
  "Get all tasks assigned to a specific user, optionally filtered by status",
  getUserTasksSchema.shape,
  async (input) => {
    const result = await getUserTasks(input as z.infer<typeof getUserTasksSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_project_stats",
  "Get project statistics: completion rate, overdue count, and weekly velocity over the last 4 weeks",
  getProjectStatsSchema.shape,
  async (input) => {
    const result = await getProjectStats(input as z.infer<typeof getProjectStatsSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_user_by_email",
  "Look up a user by their email address and return their ID, name, and email",
  getUserByEmailSchema.shape,
  async (input) => {
    const result = await getUserByEmail(input as z.infer<typeof getUserByEmailSchema>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --- Resources ---

server.resource(
  "project",
  "project://{id}",
  async (uri) => {
    const match = uri.href.match(/^project:\/\/(.+)$/);
    if (!match) throw new Error(`Invalid project URI: ${uri.href}`);
    const projectId = match[1];
    const text = await getProjectResource(projectId);
    return { contents: [{ uri: uri.href, text, mimeType: "application/json" }] };
  }
);

// --- Prompts ---

server.prompt(
  "standup",
  "Generate a daily standup template for a project",
  {
    project_id: z.string().describe("ID of the project"),
    user_name: z.string().optional().describe("Name of the user doing the standup"),
  },
  async ({ project_id, user_name }) => {
    const text = await buildStandupPrompt(project_id, user_name);
    return { messages: [{ role: "user", content: { type: "text", text } }] };
  }
);

server.prompt(
  "retrospective",
  "Generate a sprint retrospective template for a project",
  {
    project_id: z.string().describe("ID of the project"),
    sprint_name: z.string().optional().describe("Name of the sprint"),
  },
  async ({ project_id, sprint_name }) => {
    const text = await buildRetrospectivePrompt(project_id, sprint_name);
    return { messages: [{ role: "user", content: { type: "text", text } }] };
  }
);

server.prompt(
  "task_breakdown",
  "Break down an objective into suggested sub-tasks for a project",
  {
    project_id: z.string().describe("ID of the project"),
    objective: z.string().describe("The objective or feature to break down into tasks"),
  },
  async ({ project_id, objective }) => {
    const text = await buildTaskBreakdownPrompt(project_id, objective);
    return { messages: [{ role: "user", content: { type: "text", text } }] };
  }
);

// --- Start ---

async function main() {
  if (!process.env.SUPABASE_USER_ACCESS_TOKEN) {
    console.error("ERROR: SUPABASE_USER_ACCESS_TOKEN is required. The MCP server must run with the authenticated user's JWT.");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server challenge48h running on stdio (user-authenticated mode)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
