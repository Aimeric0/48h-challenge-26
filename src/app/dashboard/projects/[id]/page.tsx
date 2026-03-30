import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/supabase/projects";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
