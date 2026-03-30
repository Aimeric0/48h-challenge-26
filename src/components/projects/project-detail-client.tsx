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
  Trash2,
  X,
} from "lucide-react";
import { KanbanBoard } from "@/components/projects/kanban-board";
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
import { toast } from "sonner";
import type {
  ProjectDetail,
  TaskStatus,
  ProjectStatus,
  Profile,
  ProjectMember,
  Task,
} from "@/types/database";

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
      toast.error("Erreur lors de la suppression de la tâche");
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
          {isOwner && <AlertDialog>
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
          </AlertDialog>}
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

      {/* Kanban + Members */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tâches</h2>
        <CreateTaskDialog
          projectId={initialProject.id}
          members={members}
          existingTasks={tasks}
          onTaskCreated={handleTaskCreated}
        />
      </div>

      <KanbanBoard
        tasks={tasks}
        onTasksChange={setTasks}
        onDeleteTask={handleDeleteTask}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members */}
        <div className="lg:col-start-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membres ({members.length})
                </CardTitle>
                {isOwner && (
                  <AddMemberDialog
                    projectId={initialProject.id}
                    existingMemberIds={members.map((m) => m.user_id)}
                    onMemberAdded={handleMemberAdded}
                  />
                )}
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
