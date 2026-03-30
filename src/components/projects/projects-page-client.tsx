"use client";

import { useState } from "react";
import { Search, LayoutGrid, List, FolderOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { ProjectWithStats, ProjectStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type FilterStatus = "all" | ProjectStatus;
type ViewMode = "grid" | "list";

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "in_progress", label: "En cours" },
  { value: "planned", label: "Planifié" },
  { value: "completed", label: "Terminé" },
];

interface ProjectsPageClientProps {
  projects: ProjectWithStats[];
}

export function ProjectsPageClient({ projects: initialProjects }: ProjectsPageClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  function handleProjectCreated(project: ProjectWithStats) {
    setProjects((prev) => [project, ...prev]);
  }

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateProjectDialog onCreated={handleProjectCreated} />
      </div>

      {/* Toolbar: search + filters + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <Badge
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  statusFilter === f.value
                    ? ""
                    : "hover:bg-muted"
                )}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasProjects={projects.length > 0} onCreated={handleProjectCreated} />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasProjects, onCreated }: { hasProjects: boolean; onCreated: (p: ProjectWithStats) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasProjects ? "Aucun résultat" : "Aucun projet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasProjects
          ? "Essayez de modifier vos filtres ou votre recherche."
          : "Créez votre premier projet pour commencer à organiser vos tâches."}
      </p>
      {!hasProjects && (
        <div className="mt-4">
          <CreateProjectDialog onCreated={onCreated} />
        </div>
      )}
    </div>
  );
}

function ProjectListRow({
  project,
  onClick,
}: {
  project: ProjectWithStats;
  onClick: () => void;
}) {
  const progress =
    project.task_count > 0
      ? Math.round((project.done_count / project.task_count) * 100)
      : 0;

  const statusLabel: Record<ProjectStatus, string> = {
    planned: "Planifié",
    in_progress: "En cours",
    completed: "Terminé",
  };

  const statusClass: Record<ProjectStatus, string> = {
    planned: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/10 text-primary",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <div
      className="flex items-center gap-4 rounded-lg border bg-card p-4 cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{project.name}</span>
          <Badge
            variant="secondary"
            className={cn("shrink-0", statusClass[project.status])}
          >
            {statusLabel[project.status]}
          </Badge>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {project.description}
          </p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-6 shrink-0">
        {/* Progress */}
        <div className="w-32 space-y-1">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>

        {/* Tasks */}
        <span className="text-sm text-muted-foreground w-20 text-right">
          {project.task_count} tâche{project.task_count !== 1 ? "s" : ""}
        </span>

        {/* Members */}
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.members.length}
        </span>
      </div>
    </div>
  );
}
