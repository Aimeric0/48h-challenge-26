import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MentionsLegalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mentions legales</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editeur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Plateforme Challenge 48h</p>
          <p>Projet realise dans le cadre d&apos;un challenge de developpement.</p>
          <p>
            Contact :{" "}
            <a
              href="mailto:contact@challenge48h.fr"
              className="text-primary underline underline-offset-4"
            >
              contact@challenge48h.fr
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hebergement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Application :</strong> Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, Etats-Unis
          </p>
          <p>
            <strong>Base de donnees :</strong> Supabase Inc., region Union
            europeenne (Francfort, Allemagne)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propriete intellectuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            L&apos;ensemble du contenu de ce site (textes, interface, code) est
            protege par le droit d&apos;auteur. Toute reproduction sans
            autorisation est interdite.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donnees personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Pour toute information relative a la collecte et au traitement de
            vos donnees personnelles, consultez notre{" "}
            <a href="/privacy" className="text-primary underline underline-offset-4">
              politique de confidentialite
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
