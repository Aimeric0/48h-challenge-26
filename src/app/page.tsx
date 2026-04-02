import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  KanbanSquare,
  Trophy,
  Users,
  Bot,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: KanbanSquare,
    title: "Tableau Kanban",
    description:
      "Visualisez vos taches en colonnes drag & drop. Passez de To Do a Done en un glissement.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Trophy,
    title: "Gamification & XP",
    description:
      "Gagnez de l'XP, montez de niveau et debloquez des badges en completant vos taches.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Invitez vos coequipiers, assignez les taches et suivez la progression de l'equipe en temps reel.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Bot,
    title: "Assistant IA (MCP)",
    description:
      "Pilotez vos projets en langage naturel grace a l'assistant connecte via le protocole MCP.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

const highlights = [
  "Dashboard avec progression globale",
  "Deadlines et taches en retard",
  "Activite recente de l'equipe",
  "Statistiques par projet",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span>Challenge 48h</span>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">
                  Aller au dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Se connecter</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Creer un compte</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5" />
        <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Pensee par et pour les etudiants en info
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Gerez vos projets.{" "}
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Montez en niveau.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            La gestion de projet tellement fluide et integree dans votre
            workflow que vous la maintenez naturellement, sans effort
            supplementaire. Kanban, XP, badges et assistant IA reunis en une
            seule app.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <Button size="lg" asChild className="text-base">
                <Link href="/dashboard">
                  Ouvrir le dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="text-base">
                  <Link href="/register">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce qu&apos;il faut pour reussir vos projets
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Un outil complet concu pour le workflow des etudiants, de
            l&apos;idee a la livraison.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bg}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Un dashboard qui va a l&apos;essentiel
              </h2>
              <p className="mt-4 text-muted-foreground">
                Gardez un oeil sur la progression de tous vos projets en un seul
                endroit. Plus de surprises la veille de la deadline.
              </p>
              <ul className="mt-8 space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decorative card preview */}
            <div className="w-full max-w-md flex-1">
              <div className="rounded-xl border bg-card p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">Progression equipe</span>
                  <span className="text-sm text-muted-foreground">
                    Cette semaine
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Frontend", pct: 78, color: "bg-violet-500" },
                    { label: "Backend", pct: 62, color: "bg-amber-500" },
                    { label: "DevOps", pct: 45, color: "bg-pink-500" },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{bar.label}</span>
                        <span className="text-muted-foreground">
                          {bar.pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${bar.color}`}
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="border-t bg-gradient-to-r from-violet-500 to-pink-500 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pret a booster vos projets ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Rejoignez la plateforme et transformez la facon dont votre equipe
            gere ses projets.
          </p>
          <div className="mt-8">
            {user ? (
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-base"
              >
                <Link href="/dashboard">
                  Ouvrir le dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-base"
              >
                <Link href="/register">
                  Creer un compte gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>&copy; {new Date().getFullYear()} Challenge 48h</span>
          </div>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Politique de confidentialite
            </Link>
            <Link
              href="/mentions-legales"
              className="transition-colors hover:text-foreground"
            >
              Mentions legales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
