"use client";

import { useState } from "react";
import { UserPlus, Search, Loader2 } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProjectMember } from "@/types/database";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AddMemberDialogProps {
  projectId: string;
  existingMemberIds: string[];
  onMemberAdded: (member: ProjectMember & { profile: Profile }) => void;
}

export function AddMemberDialog({
  projectId,
  existingMemberIds,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  function reset() {
    setEmail("");
    setFoundUser(null);
    setError("");
    setSearching(false);
    setAdding(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSearching(true);
    setError("");
    setFoundUser(null);

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, xp, level, created_at, updated_at")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (!profile) {
        setError("Aucun utilisateur trouvé avec cet email.");
        return;
      }

      if (existingMemberIds.includes(profile.id)) {
        setError("Cet utilisateur est déjà membre du projet.");
        return;
      }

      setFoundUser(profile as Profile);
    } catch {
      setError("Aucun utilisateur trouvé avec cet email.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd() {
    if (!foundUser) return;

    setAdding(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: foundUser.id,
          role: "member",
        });

      if (insertError) throw insertError;

      const newMember: ProjectMember & { profile: Profile } = {
        project_id: projectId,
        user_id: foundUser.id,
        role: "member",
        joined_at: new Date().toISOString(),
        profile: foundUser,
      };

      onMemberAdded(newMember);
      setOpen(false);
      reset();
    } catch {
      setError("Erreur lors de l'ajout du membre.");
    } finally {
      setAdding(false);
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
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Recherchez un utilisateur par son adresse email pour l'ajouter au
            projet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email de l'utilisateur</Label>
            <div className="flex gap-2">
              <Input
                id="member-email"
                type="email"
                placeholder="utilisateur@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFoundUser(null);
                  setError("");
                }}
                required
              />
              <Button type="submit" variant="secondary" disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {foundUser && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(foundUser.full_name || foundUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {foundUser.full_name || "Sans nom"}
                </p>
                <p className="text-xs text-muted-foreground">{foundUser.email}</p>
              </div>
            </div>
          )}

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
            <Button
              type="button"
              disabled={!foundUser || adding}
              onClick={handleAdd}
            >
              {adding ? "Ajout..." : "Ajouter au projet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
