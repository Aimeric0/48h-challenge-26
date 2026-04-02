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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Check, Download, Loader2, Lock, Palette, Save, Trash2 } from "lucide-react";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
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
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setFullName(profile?.full_name || "");
        setAvatarUrl(profile?.avatar_url || null);
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
      setError("Erreur lors de la mise à jour du profil.");
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
        setError("Erreur lors de la mise à jour de l'email.");
        setLoading(false);
        return;
      }
    }

    setSuccess("Profil mis à jour avec succès.");
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setAvatarUploading(true);
    setError("");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${userId}/avatar.${ext}`;

      // Upload file (upsert to replace existing)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError("Erreur lors du téléversement de l'avatar.");
        setAvatarUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + "?t=" + Date.now();

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (profileError) {
        setError("Erreur lors de la mise à jour du profil.");
        setAvatarUploading(false);
        return;
      }

      setAvatarUrl(publicUrl);
      setSuccess("Avatar mis à jour avec succès.");
    } catch {
      setError("Erreur lors du téléversement de l'avatar.");
    }
    setAvatarUploading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setPasswordLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setPasswordError("Erreur lors de la mise à jour du mot de passe.");
      setPasswordLoading(false);
      return;
    }

    setPasswordSuccess("Mot de passe mis à jour avec succès.");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordLoading(false);
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
      setError("Erreur lors de l'export des données.");
    }
    setExportLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre compte et vos préférences.
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {fullName
                      ? fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Photo de profil</Label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou GIF. 2 Mo max.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarUploading}
                  onClick={() => document.getElementById("avatar-input")?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Changer la photo
                </Button>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
            <Separator />
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
            <Lock className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe pour sécuriser votre compte.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            {passwordSuccess && (
              <Alert>
                <AlertDescription>{passwordSuccess}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 caractères minimum"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Mettre à jour le mot de passe
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
                { id: "system", label: "Système" },
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
          <CardTitle>Mes données</CardTitle>
          <CardDescription>
            Exportez une copie de toutes vos données personnelles
            (profil, projets, tâches) au format JSON.
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
            Exporter mes données
          </Button>
          <a
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Politique de confidentialité
          </a>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            La suppression de votre compte est irréversible. Toutes vos
            données seront définitivement supprimées.
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
                  Cette action est irréversible. Tous vos projets,
                  tâches et données personnelles seront définitivement
                  supprimés.
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
                  Supprimer définitivement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
