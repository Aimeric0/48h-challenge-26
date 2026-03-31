"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useId } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  GripVertical,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Task, TaskStatus, Profile } from "@/types/database";

type TaskWithAssignee = Task & { assignee: Profile | null };

interface KanbanBoardProps {
  tasks: TaskWithAssignee[];
  onTasksChange: (tasks: TaskWithAssignee[]) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.ElementType; color: string; dotClass: string; bgClass: string }[] = [
  {
    id: "backlog",
    label: "Backlog",
    icon: Archive,
    color: "text-slate-500 dark:text-slate-400",
    dotClass: "bg-slate-500 dark:bg-slate-400",
    bgClass: "bg-slate-50 dark:bg-slate-950/20",
  },
  {
    id: "todo",
    label: "A faire",
    icon: CircleDot,
    color: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
    bgClass: "bg-muted/30",
  },
  {
    id: "in_progress",
    label: "En cours",
    icon: Clock,
    color: "text-primary",
    dotClass: "bg-primary",
    bgClass: "bg-primary/5",
  },
  {
    id: "review",
    label: "En revue",
    icon: Eye,
    color: "text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-600 dark:bg-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: "done",
    label: "Terminé",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// --- Sortable Task Card ---

function SortableTaskCard({
  task,
  onDelete,
}: {
  task: TaskWithAssignee;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-30">
        <TaskCardContent task={task} onDelete={onDelete} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent
        task={task}
        onDelete={onDelete}
        dragListeners={listeners}
      />
    </div>
  );
}

// --- Task Card Content (shared between real card and drag overlay) ---

function TaskCardContent({
  task,
  onDelete,
  dragListeners,
}: {
  task: TaskWithAssignee;
  onDelete: (id: string) => void;
  dragListeners?: Record<string, unknown>;
}) {
  const taskOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "done";

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-default group">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
            {...(dragListeners as React.HTMLAttributes<HTMLButtonElement>)}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-snug">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(task.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 pl-6">
          {task.deadline && (
            <Badge
              variant={taskOverdue ? "destructive" : "secondary"}
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              <Calendar className="h-2.5 w-2.5 mr-1" />
              {new Date(task.deadline).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </Badge>
          )}
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {getInitials(
                  task.assignee.full_name || task.assignee.email
                )}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Droppable Column ---

function KanbanColumn({
  column,
  tasks,
  onDeleteTask,
}: {
  column: (typeof COLUMNS)[number];
  tasks: TaskWithAssignee[];
  onDeleteTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`} />
        <h3 className={`font-semibold text-sm ${column.color}`}>
          {column.label}
        </h3>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
          {tasks.length}
        </Badge>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 transition-colors min-h-[120px] ${
          column.bgClass
        } ${isOver ? "ring-2 ring-primary/30" : ""}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Glissez une tâche ici
          </p>
        )}
      </div>
    </div>
  );
}

// --- Main Kanban Board ---

export function KanbanBoard({
  tasks,
  onTasksChange,
  onDeleteTask,
}: KanbanBoardProps) {
  const dndId = useId();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const [dragOriginalStatus, setDragOriginalStatus] = useState<TaskStatus | null>(null);
  const isDragging = useRef(false);

  // Sync from parent when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithAssignee[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const task of localTasks) {
      grouped[task.status].push(task);
    }
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [localTasks]);

  function findColumnOfTask(taskId: string): TaskStatus | null {
    for (const [status, columnTasks] of Object.entries(tasksByStatus)) {
      if (columnTasks.some((t) => t.id === taskId)) {
        return status as TaskStatus;
      }
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    isDragging.current = true;
    const task = localTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
    setDragOriginalStatus(task?.status || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnOfTask(activeId);
    const overColumn =
      (COLUMNS.find((c) => c.id === overId)?.id as TaskStatus) ||
      findColumnOfTask(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Update local state only — no parent re-render during drag
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status: overColumn } : t
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    isDragging.current = false;

    if (!over) {
      // Cancelled — revert to parent state
      setLocalTasks(tasks);
      setDragOriginalStatus(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnOfTask(activeId);
    const overIsColumn = COLUMNS.some((c) => c.id === overId);
    const overColumn = overIsColumn
      ? (overId as TaskStatus)
      : findColumnOfTask(overId);

    if (!activeColumn || !overColumn) return;

    // Reorder within column
    const columnTasks = [...tasksByStatus[overColumn]];
    const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
    const overIndex = overIsColumn
      ? columnTasks.length - 1
      : columnTasks.findIndex((t) => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const reordered = arrayMove(columnTasks, activeIndex, overIndex);
      const updatedPositions = reordered.map((t, i) => ({
        ...t,
        position: i,
      }));
      const finalTasks = localTasks.map((t) => {
        const updated = updatedPositions.find((u) => u.id === t.id);
        return updated || t;
      });
      setLocalTasks(finalTasks);
      onTasksChange(finalTasks);
      persistPositions(updatedPositions);
    } else {
      // Commit current local state to parent
      onTasksChange(localTasks);
      const updatedPositions = columnTasks.map((t, i) => ({
        ...t,
        position: i,
      }));
      persistPositions(updatedPositions);
    }

    // Persist status change
    if (dragOriginalStatus && dragOriginalStatus !== overColumn) {
      persistStatus(activeId, overColumn);
    }
    setDragOriginalStatus(null);
  }

  async function persistStatus(taskId: string, newStatus: TaskStatus) {
    const supabase = createClient();
    const task = localTasks.find((t) => t.id === taskId);

    // Auto-assign current user when dropping in "done" without assignee
    const updateData: Record<string, string> = { status: newStatus };
    if (newStatus === "done" && task && !task.assignee_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updateData.assignee_id = user.id;
      }
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);
    if (error) {
      console.error("[kanban] Status update failed:", error);
      toast.error("Erreur lors du déplacement de la tâche");
    }
  }

  async function persistPositions(
    tasksToUpdate: { id: string; position: number }[]
  ) {
    if (tasksToUpdate.length === 0) return;
    const supabase = createClient();
    const payload = tasksToUpdate.map((t) => ({
      task_id: t.id,
      new_position: t.position,
    }));
    const { error } = await supabase.rpc("batch_update_task_positions", {
      updates: payload,
    });
    if (error) {
      console.error("[kanban] Position update failed:", error);
      toast.error("Erreur lors de la réorganisation des tâches");
    }
  }

  return (
    <ScrollArea className="w-full">
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-w-max pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id]}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[260px]">
              <TaskCardContent
                task={activeTask}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
