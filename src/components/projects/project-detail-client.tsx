"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ListTodo,
  CircleDot,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddMemberDialog } from "@/components/projects/add-member-dialog";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { createClient } from "@/lib/supabase/client";
import type {
  ProjectDetail,
  TaskStatus,
  ProjectStatus,
  Profile,
  ProjectMember,
  Task,
} from "@/types/database";

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; className: string; dotClass: string }
> = {
  todo: {
    label: "A faire",
    icon: CircleDot,
    className: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  in_progress: {
    label: "En cours",
    icon: Clock,
    className: "text-primary",
    dotClass: "bg-primary",
  },
  done: {
    label: "Terminé",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ProjectDetailClientProps {
  project: ProjectDetail;
  currentUserId: string;
}

export function ProjectDetailClient({ project: initialProject, currentUserId }: ProjectDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ProjectStatus>(initialProject.status);
  const [members, setMembers] = useState(initialProject.members);
  const [tasks, setTasks] = useState(initialProject.tasks);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const now = new Date().toISOString();
  const overdueCount = tasks.filter(
    (t) => t.deadline && t.deadline < now && t.status !== "done"
  ).length;

  const progress =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const isOverdue =
    initialProject.deadline &&
    new Date(initialProject.deadline) < new Date() &&
    status !== "completed";

  const tasksByStatus: Record<TaskStatus, typeof tasks> = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const owner = members.find((m) => m.role === "owner");
  const isOwner = owner?.user_id === currentUserId;

  async function handleRemoveMember(userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", initialProject.id)
      .eq("user_id", userId);
    if (error) {
      console.error("[remove-member] Failed:", error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  }

  function handleMemberAdded(member: ProjectMember & { profile: Profile }) {
    setMembers((prev) => [...prev, member]);
  }

  function handleTaskCreated(task: Task & { assignee: Profile | null }) {
    setTasks((prev) => [...prev, task]);
  }

  const [deletingProject, setDeletingProject] = useState(false);

  async function handleDeleteProject() {
    setDeletingProject(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", initialProject.id);
      if (error) throw error;
      router.push("/dashboard/projects");
    } catch (err) {
      console.error("[delete-project] Failed:", err);
      setDeletingProject(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);
    if (error) {
      console.error("[delete-task] Failed:", error);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => router.push("/dashboard/projects")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour aux projets
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {initialProject.name}
              </h1>
              <ProjectStatusSelect
                projectId={initialProject.id}
                currentStatus={status}
                onStatusChanged={setStatus}
              />
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes les tâches et les
                  membres associés seront également supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={deletingProject}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingProject ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="space-y-1">
            {initialProject.description && (
              <p className="text-muted-foreground max-w-2xl">
                {initialProject.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              {initialProject.deadline && (
                <span
                  className={`flex items-center gap-1 ${
                    isOverdue ? "text-destructive font-medium" : ""
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {isOverdue ? "En retard — " : "Échéance : "}
                  {formatDate(initialProject.deadline)}
                </span>
              )}
              {owner && (
                <span className="flex items-center gap-1">
                  Créé par {owner.profile?.full_name || owner.profile?.email}
                </span>
              )}
            </div>
          </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Progression"
          value={`${progress}%`}
          icon={CheckCircle2}
          iconClass="text-primary"
          sub={
            tasks.length > 0
              ? `${doneCount}/${tasks.length} terminées`
              : "Aucune tâche"
          }
        />
        <StatCard
          label="A faire"
          value={tasksByStatus.todo.length}
          icon={ListTodo}
          iconClass="text-muted-foreground"
        />
        <StatCard
          label="En cours"
          value={tasksByStatus.in_progress.length}
          icon={Clock}
          iconClass="text-primary"
        />
        <StatCard
          label="En retard"
          value={overdueCount}
          icon={AlertTriangle}
          iconClass={overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks — takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task header with create button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tâches</h2>
            <CreateTaskDialog
              projectId={initialProject.id}
              members={members}
              onTaskCreated={handleTaskCreated}
            />
          </div>

          {(["todo", "in_progress", "done"] as TaskStatus[]).map((taskStatus) => {
            const config = TASK_STATUS_CONFIG[taskStatus];
            const statusTasks = tasksByStatus[taskStatus];
            return (
              <div key={taskStatus}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
                  <h3 className={`font-semibold ${config.className}`}>
                    {config.label}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({statusTasks.length})
                  </span>
                </div>

                {statusTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-5">
                    Aucune tâche
                  </p>
                ) : (
                  <div className="space-y-2">
                    {statusTasks.map((task) => {
                      const taskOverdue =
                        task.deadline &&
                        new Date(task.deadline) < new Date() &&
                        task.status !== "done";

                      return (
                        <Card key={task.id} className="shadow-none">
                          <CardContent className="flex items-center gap-3 py-3 px-4">
                            <config.icon
                              className={`h-4 w-4 shrink-0 ${config.className}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.deadline && (
                                <span
                                  className={`text-xs flex items-center gap-1 ${
                                    taskOverdue
                                      ? "text-destructive font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.deadline).toLocaleDateString(
                                    "fr-FR",
                                    { day: "numeric", month: "short" }
                                  )}
                                </span>
                              )}
                              {task.assignee && (
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                    {getInitials(
                                      task.assignee.full_name ||
                                        task.assignee.email
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar — Members */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membres ({members.length})
                </CardTitle>
                <AddMemberDialog
                  projectId={initialProject.id}
                  existingMemberIds={members.map((m) => m.user_id)}
                  onMemberAdded={handleMemberAdded}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.profile
                        ? getInitials(
                            member.profile.full_name || member.profile.email
                          )
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.profile?.full_name || member.profile?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === "owner" ? "Propriétaire" : "Membre"}
                    </p>
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemoveMember(member.user_id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass?: string;
  sub?: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${iconClass || "text-muted-foreground"}`} />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
