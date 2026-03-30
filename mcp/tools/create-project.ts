import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";

export const createProjectSchema = z.object({
  name: z.string().describe("Name of the project"),
  description: z.string().optional().describe("Description of the project"),
  deadline: z.string().optional().describe("Deadline in ISO 8601 format"),
  owner_id: z.string().describe("User ID of the project owner"),
});

export async function createProject(input: z.infer<typeof createProjectSchema>) {
  const supabase = await getSupabase();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      description: input.description ?? null,
      deadline: input.deadline ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);

  // Add the owner as a project member with role "owner"
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: project.id,
      user_id: input.owner_id,
      role: "owner",
    });

  if (memberError) throw new Error(`Project created but failed to add owner: ${memberError.message}`);

  return project;
}
