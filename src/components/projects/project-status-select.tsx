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
import type { ProjectStatus } from "@/types/database";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Planifié" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
];

interface ProjectStatusSelectProps {
  projectId: string;
  currentStatus: ProjectStatus;
  onStatusChanged: (status: ProjectStatus) => void;
}

export function ProjectStatusSelect({
  projectId,
  currentStatus,
  onStatusChanged,
}: ProjectStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  async function handleChange(value: string) {
    const newStatus = value as ProjectStatus;
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;

      onStatusChanged(newStatus);
    } catch (err) {
      console.error("[project-status] Update failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
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
