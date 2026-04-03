import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/supabase/projects";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const project = await getProjectById(id);

  if (!project || !user) {
    notFound();
  }

  return <ProjectDetailClient project={project} currentUserId={user.id} />;
}
