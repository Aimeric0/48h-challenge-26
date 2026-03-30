"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Download, Loader2, Palette, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useColorTheme } from "@/components/color-theme-provider";
import { useTheme } from "next-themes";
import { COLOR_THEMES } from "@/lib/themes";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const { colorTheme, setColorTheme } = useColorTheme();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setFullName(profile?.full_name || "");
      }
    }
    loadProfile();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!userId) return;

    // Update profile in database
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (profileError) {
      setError("Erreur lors de la mise a jour du profil.");
      setLoading(false);
      return;
    }

    // Update email if changed
    const { data: { user } } = await supabase.auth.getUser();
    if (email !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email,
      });
      if (emailError) {
        setError("Erreur lors de la mise a jour de l'email.");
        setLoading(false);
        return;
      }
    }

    setSuccess("Profil mis a jour avec succes.");
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      if (!response.ok) {
        setError("Erreur lors de la suppression du compte.");
        setDeleteLoading(false);
        return;
      }
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Erreur lors de la suppression du compte.");
      setDeleteLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mes-donnees.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur lors de l'export des donnees.");
    }
    setExportLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez votre compte et vos preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Modifiez votre nom et votre adresse email.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apparence
          </CardTitle>
          <CardDescription>
            Choisissez le mode d&apos;affichage et la couleur d&apos;accent de
            l&apos;interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Mode</Label>
            <div className="flex gap-2">
              {[
                { id: "light", label: "Clair" },
                { id: "dark", label: "Sombre" },
                { id: "system", label: "Systeme" },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  variant={theme === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(mode.id)}
                >
                  {theme === mode.id && <Check className="mr-1.5 h-3.5 w-3.5" />}
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Couleur d&apos;accent</Label>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setColorTheme(t.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-accent/50 ${
                    colorTheme === t.id
                      ? "border-primary bg-accent/30"
                      : "border-transparent"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full border-2 border-border/50 ${
                      colorTheme === t.id
                        ? "ring-2 ring-offset-2 ring-offset-background"
                        : ""
                    }`}
                    style={{
                      backgroundColor: t.color,
                      ...(colorTheme === t.id && {
                        "--tw-ring-color": t.color,
                      }),
                    }}
                  />
                  <span className="text-xs font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes donnees</CardTitle>
          <CardDescription>
            Exportez une copie de toutes vos donnees personnelles
            (profil, conversations, messages) au format JSON.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter mes donnees
          </Button>
          <a
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Politique de confidentialite
          </a>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            La suppression de votre compte est irreversible. Toutes vos
            donnees seront definitivement supprimees.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Cette action est irreversible. Toutes vos conversations,
                  messages et donnees personnelles seront definitivement
                  supprimes.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Supprimer definitivement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
