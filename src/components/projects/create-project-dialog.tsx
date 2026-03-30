"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("[create-project] No authenticated user");
        return;
      }

      console.log("[create-project] Inserting project...");
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          description: description.trim(),
          deadline: deadline || null,
          owner_id: user.id,
          status: "planned",
        })
        .select("id")
        .single();

      if (projectError || !project) {
        console.error("[create-project] Project insert failed:", projectError);
        throw projectError;
      }
      console.log("[create-project] Project created:", project.id);

      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) {
        console.error("[create-project] Member insert failed:", memberError);
        throw memberError;
      }
      console.log("[create-project] Owner member added");

      setOpen(false);
      setName("");
      setDescription("");
      setDeadline("");
      router.refresh();
    } catch (err) {
      console.error("[create-project] Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creer un projet</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour creer un nouveau projet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nom du projet *</Label>
            <Input
              id="project-name"
              placeholder="Mon super projet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              placeholder="Decrivez votre projet en quelques mots..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-deadline">Date limite</Label>
            <Input
              id="project-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creation..." : "Creer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
