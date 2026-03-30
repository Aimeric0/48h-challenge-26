import { getProjectsWithStats } from "@/lib/supabase/projects";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();

  return <ProjectsPageClient projects={projects} />;
}
