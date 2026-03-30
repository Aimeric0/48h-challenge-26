import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { listProjects, listProjectsSchema } from "./tools/list-projects.js";
import { listTasks, listTasksSchema } from "./tools/list-tasks.js";
import { createTask, createTaskSchema } from "./tools/create-task.js";
import { updateTask, updateTaskSchema } from "./tools/update-task.js";
import { getProjectSummary, getProjectSummarySchema } from "./tools/get-project-summary.js";
import { getProjectResource } from "./resources/project-resource.js";
import { buildStandupPrompt } from "./prompts/standup.js";

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

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server challenge48h running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
