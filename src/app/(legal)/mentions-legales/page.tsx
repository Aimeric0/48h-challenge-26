import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MentionsLegalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mentions légales</h1>

      <Card>
        <CardHeader>
          <CardTitle>Éditeur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Plateforme Challenge 48h</p>
          <p>Projet réalisé dans le cadre d&apos;un challenge de développement.</p>
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
          <CardTitle>Hébergement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Application :</strong> Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, États-Unis
          </p>
          <p>
            <strong>Base de données :</strong> Supabase Inc., région Union
            européenne (Francfort, Allemagne)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propriété intellectuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            L&apos;ensemble du contenu de ce site (textes, interface, code) est
            protégé par le droit d&apos;auteur. Toute reproduction sans
            autorisation est interdite.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Pour toute information relative à la collecte et au traitement de
            vos données personnelles, consultez notre{" "}
            <a href="/privacy" className="text-primary underline underline-offset-4">
              politique de confidentialité
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
