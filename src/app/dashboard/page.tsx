import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const [profileRes, statsRes, projectsRes, activitiesRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("projects").select("id", { count: 'exact' }),
    supabase.from("projects")
      .select("id, name, progress, updated_at, status")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("activities")
      .select("id, content, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const profile = profileRes.data;
  const projects = projectsRes.data || [];
  const activities = activitiesRes.data || [];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {profile?.full_name || "utilisateur"} !
        </h1>
        <p className="text-muted-foreground">
          Voici l'état global de vos responsabilités.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 text-blue-600">
            <CardTitle className="text-sm font-medium text-foreground">Projets Actifs</CardTitle>
            <LayoutDashboard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsRes.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 text-green-600">
            <CardTitle className="text-sm font-medium text-foreground">Tâches Finies</CardTitle>
            <CheckCircle2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 text-orange-600">
            <CardTitle className="text-sm font-medium text-foreground">Temps Total</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 text-destructive">
            <CardTitle className="text-sm font-medium text-foreground">Alertes</CardTitle>
            <AlertCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Suivi des Projets en Cours</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Détails de la progression par rapport aux objectifs.</p>
            </div>
            <Link href="/dashboard/projects" className="text-sm text-primary hover:underline font-medium">
              Voir tout
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{project.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      project.progress > 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {project.progress === 100 ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold italic">Dernières modifications</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center text-muted-foreground group-hover:text-primary">
                    Aperçu
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="font-bold text-lg mb-4 truncate">{project.name}</p>
                   <div className="text-xs text-muted-foreground">
                      Dernière mise à jour : {new Date(project.updated_at).toLocaleDateString()}
                   </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flux d'activité collaborateur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length > 0 ? activities.map((activity) => {
              const profileData = Array.isArray(activity.profiles) 
                ? activity.profiles[0] 
                : activity.profiles;

              return (
                <div key={activity.id} className="flex items-center gap-4 text-sm border-b pb-3 last:border-0">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground shrink-0 border">
                    {profileData?.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p>
                      <span className="font-bold text-foreground">{profileData?.full_name || "Anonyme"}</span>{" "}
                      <span className="text-muted-foreground">{activity.content}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(activity.created_at).toLocaleString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune activité.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}