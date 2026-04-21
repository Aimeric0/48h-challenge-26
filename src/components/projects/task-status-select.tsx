"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { TaskStatus } from "@/types/database";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "A faire" },
  { value: "in_progress", label: "En cours" },
  { value: "review", label: "En revue" },
  { value: "done", label: "Terminé" },
];

interface TaskStatusSelectProps {
  taskId: string;
  currentStatus: TaskStatus;
  assigneeId?: string | null;
  currentUserId?: string;
  onStatusChanged: (taskId: string, status: TaskStatus) => void;
}

export function TaskStatusSelect({
  taskId,
  currentStatus,
  assigneeId,
  currentUserId,
  onStatusChanged,
}: TaskStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    const newStatus = value as TaskStatus;
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Auto-assign current user when completing an unassigned task
      const updateData: Record<string, string> = { status: newStatus };
      if (newStatus === "done" && !assigneeId && currentUserId) {
        updateData.assignee_id = currentUserId;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;

      onStatusChanged(taskId, newStatus);
    } catch (err) {
      console.error("[task-status] Update failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-7 text-xs w-[110px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
