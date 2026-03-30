"use client";

import { Calendar, AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProjectWithStats, ProjectStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  planned: {
    label: "Planifie",
    className:
      "bg-muted text-muted-foreground hover:bg-muted",
    icon: Clock,
  },
  in_progress: {
    label: "En cours",
    className:
      "bg-primary/10 text-primary hover:bg-primary/10",
    icon: Clock,
  },
  completed: {
    label: "Termine",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    icon: CheckCircle2,
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

interface ProjectCardProps {
  project: ProjectWithStats;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = STATUS_CONFIG[project.status];
  const progress =
    project.task_count > 0
      ? Math.round((project.done_count / project.task_count) * 100)
      : 0;

  const isOverdue =
    project.deadline && new Date(project.deadline) < new Date() && project.status !== "completed";

  const maxAvatars = 3;
  const visibleMembers = project.members.slice(0, maxAvatars);
  const extraMembers = project.members.length - maxAvatars;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-1">
            {project.name}
          </h3>
          <Badge variant="secondary" className={status.className}>
            {status.label}
          </Badge>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Deadline + overdue */}
        <div className="flex items-center gap-2 text-sm">
          {project.deadline && (
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {formatDeadline(project.deadline)}
            </span>
          )}
          {project.overdue_count > 0 && (
            <span className="flex items-center gap-1 text-destructive text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {project.overdue_count} en retard
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer: task count + members */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">
            {project.task_count} tache{project.task_count !== 1 ? "s" : ""}
          </span>

          {project.members.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {visibleMembers.map((member) => (
                  <Avatar
                    key={member.user_id}
                    className="h-7 w-7 border-2 border-card"
                  >
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {member.profile
                        ? getInitials(member.profile.full_name || member.profile.email)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {extraMembers > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground font-medium">
                  +{extraMembers}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
