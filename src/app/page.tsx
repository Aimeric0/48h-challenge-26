import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
// J'utilise Lucide-React pour les icônes (standard avec Tailwind)
import { 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  Users, 
  Settings, 
  LogOut,
  Plus
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // On garde ta logique de sécurité : si pas d'utilisateur -> Login
  if (!user) {
    redirect("/login");
  }

  // Note : J'ai supprimé la redirection vers /dashboard pour que 
  // le code ci-dessous puisse s'afficher sur la page d'accueil.

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#1F2937]">
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-[#030213] rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold tracking-tight">Challenge 48h</span>
          </div>

          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] transition-all">
              <LayoutDashboard size={20} />
              <span className="font-semibold">Tableau de bord</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all">
              <FolderKanban size={20} />
              <span className="font-medium">Projets</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all">
            <Settings size={20} />
            <span className="font-medium">Paramètres</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all mt-1">
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-gray-500 mt-1">Content de vous revoir, voici vos activités.</p>
          </div>
          <button className="bg-[#030213] hover:shadow-lg hover:scale-[1.02] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all">
            <Plus size={20} /> Nouveau projet
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard label="Projets actifs" value="12" detail="+2 ce mois" />
          <StatsCard label="Tâches en cours" value="47" detail="12 urgentes" />
          <StatsCard label="Heures passées" value="164h" detail="Semaine en cours" />
          <StatsCard label="Membres" value="8" detail="3 en ligne" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Projets en cours</h3>
              <button className="text-sm font-semibold text-[#8B5CF6] hover:underline">Voir tout</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs uppercase font-bold text-gray-400">Nom du projet</th>
                    <th className="px-6 py-4 text-xs uppercase font-bold text-gray-400">Progression</th>
                    <th className="px-6 py-4 text-xs uppercase font-bold text-gray-400">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <ProjectRow name="Refonte Site Web" progress={75} date="12 Oct" color="bg-blue-500" />
                  <ProjectRow name="App Mobile" progress={40} date="24 Nov" color="bg-[#8B5CF6]" />
                  <ProjectRow name="Campagne Marketing" progress={90} date="05 Oct" color="bg-green-500" />
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold">Dernières modifications</h3>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <ActivityItem 
                user="Marie D." 
                action="a validé la tâche" 
                target="Moodboard" 
                time="Il y a 2h" 
                initials="MD" 
                color="bg-pink-100 text-pink-600" 
              />
              <ActivityItem 
                user="Toi" 
                action="as modifié le projet" 
                target="App Mobile" 
                time="Il y a 5h" 
                initials="MO" 
                color="bg-gray-100 text-gray-600" 
              />
              <ActivityItem 
                user="Julien R." 
                action="a ajouté un fichier" 
                target="Assets.zip" 
                time="Hier" 
                initials="JR" 
                color="bg-blue-100 text-blue-600" 
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Petits composants utilitaires pour la propreté du code ---

function StatsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        <Clock size={12} /> {detail}
      </p>
    </div>
  );
}

function ProjectRow({ name, progress, date, color }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 font-semibold text-sm">{name}</td>
      <td className="px-6 py-4">
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className={`${color} h-full`} style={{ width: `${progress}%` }}></div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{date}</td>
    </tr>
  );
}

function ActivityItem({ user, action, target, time, initials, color }: any) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${color}`}>
        {initials}
      </div>
      <div>
        <p className="text-sm">
          <span className="font-bold">{user}</span> {action} <span className="text-[#8B5CF6] font-medium">{target}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}