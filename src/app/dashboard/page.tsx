import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Settings, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Bonjour, {profile?.full_name || "utilisateur"} !
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenue sur votre tableau de bord, voici l'état de vos projets.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/settings" className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm">
            <Settings className="h-5 w-5 text-gray-600" />
          </Link>
          <button className="bg-[#030213] hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Nouveau projet
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard label="Projets actifs" value="12" />
        <StatsCard label="Tâches en cours" value="47" />
        <StatsCard label="Tâches terminées" value="134" />
        <StatsCard label="Membres d'équipe" value="8" />
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#1F2937]">Projets récents</h3>
          <button className="text-sm text-[#8B5CF6] font-medium hover:underline">Voir tout</button>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-12 text-center text-gray-400 italic">
            Chargement de la liste des projets...
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h3 className="text-lg font-bold text-[#1F2937]">Activité récente</h3>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899] font-bold">
            {profile?.full_name?.substring(0, 2).toUpperCase() || "JD"}
          </div>
          <div>
            <p className="text-sm text-gray-800">
              <span className="font-bold">{profile?.full_name || "Vous"}</span> a consulté les paramètres de compte.
            </p>
            <p className="text-xs text-gray-400 mt-1">À l'instant</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
    </div>
  );
}