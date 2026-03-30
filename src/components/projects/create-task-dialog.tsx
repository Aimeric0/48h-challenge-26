"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Task, TaskStatus, Profile, ProjectMember } from "@/types/database";

interface CreateTaskDialogProps {
  projectId: string;
  members: (ProjectMember & { profile: Profile })[];
  existingTasks: Task[];
  onTaskCreated: (task: Task & { assignee: Profile | null }) => void;
}

export function CreateTaskDialog({
  projectId,
  members,
  existingTasks,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [deadline, setDeadline] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setAssigneeId("none");
    setDeadline("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Compute next position for the target status column
      const maxPosition = existingTasks
        .filter((t) => t.status === status)
        .reduce((max, t) => Math.max(max, t.position), -1);

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: title.trim(),
          description: description.trim(),
          status,
          assignee_id: assigneeId === "none" ? null : assigneeId,
          deadline: deadline || null,
          position: maxPosition + 1,
        })
        .select("*")
        .single();

      if (error || !task) throw error;

      const assignee =
        assigneeId !== "none"
          ? members.find((m) => m.user_id === assigneeId)?.profile || null
          : null;

      onTaskCreated({ ...task, assignee });
      setOpen(false);
      reset();
      toast.success("Tâche créée avec succès");
    } catch (err) {
      console.error("[create-task] Failed:", err);
      toast.error("Erreur lors de la création de la tâche");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle tâche
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une tâche</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle tâche à ce projet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titre *</Label>
            <Input
              id="task-title"
              placeholder="Nom de la tâche"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Décrivez la tâche..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigné</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || m.profile?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-deadline">Date limite</Label>
            <Input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Création..." : "Créer la tâche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
