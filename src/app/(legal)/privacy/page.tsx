import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : mars 2026
      </p>

      <Card>
        <CardHeader>
          <CardTitle>1. Responsable du traitement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Le responsable du traitement des données personnelles est
            l&apos;éditeur de la plateforme Challenge 48h.
          </p>
          <p>
            Pour toute question relative à vos données personnelles, vous pouvez
            nous contacter à l&apos;adresse :{" "}
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
          <CardTitle>2. Données collectées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Nous collectons les données suivantes :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Informations de compte :</strong> adresse email, nom
              complet, mot de passe (stocké sous forme chiffrée)
            </li>
            <li>
              <strong>Projets et tâches :</strong> données de gestion de
              projet (titres, descriptions, statuts, assignations)
            </li>
            <li>
              <strong>Données techniques :</strong> cookies de session
              d&apos;authentification
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Finalités du traitement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-6">
            <li>Gestion de votre compte et authentification</li>
            <li>Fourniture du service de gestion de projet</li>
            <li>Suivi de la progression et gamification</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Destinataires des données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Supabase (hébergement)</p>
            <p>
              Vos données de compte, projets et tâches sont hébergées par Supabase
              sur des serveurs situés dans l&apos;Union européenne (région
              Francfort, Allemagne).
            </p>
          </div>
          <div>
            <p className="font-medium">Claude Desktop via MCP (assistant IA)</p>
            <p>
              L&apos;application expose un serveur MCP (Model Context Protocol)
              permettant à Claude Desktop d&apos;interagir avec vos projets et
              tâches. Ce traitement s&apos;effectue localement sur votre machine
              et aucune donnée n&apos;est transmise à des serveurs tiers via ce
              canal.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Sous-traitants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Les sous-traitants suivants interviennent dans le traitement de vos
            données :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Sous-traitant</th>
                  <th className="py-2 pr-4 text-left font-medium">Rôle</th>
                  <th className="py-2 pr-4 text-left font-medium">Localisation</th>
                  <th className="py-2 text-left font-medium">DPA</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Supabase Inc.</td>
                  <td className="py-2 pr-4">Hébergement et authentification</td>
                  <td className="py-2 pr-4">UE (Francfort)</td>
                  <td className="py-2">Inclus dans les CGU Supabase</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Anthropic (Claude)</td>
                  <td className="py-2 pr-4">Assistant IA via MCP (local)</td>
                  <td className="py-2 pr-4">Local (Claude Desktop)</td>
                  <td className="py-2">Traitement local</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Vercel Inc.</td>
                  <td className="py-2 pr-4">Hébergement de l&apos;application</td>
                  <td className="py-2 pr-4">International (CDN)</td>
                  <td className="py-2">Inclus dans les CGU Vercel</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            Des accords de traitement des données (DPA) sont en cours de
            formalisation avec l&apos;ensemble de nos sous-traitants
            conformément à l&apos;article 28 du RGPD.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Durée de conservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Vos données sont conservées tant que votre compte est actif. En cas
            de suppression de votre compte, toutes vos données personnelles,
            projets et tâches sont définitivement supprimés de nos
            serveurs.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Vos droits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Conformément au Règlement Général sur la Protection des Données
            (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Droit d&apos;accès :</strong> obtenir une copie de vos
              données personnelles
            </li>
            <li>
              <strong>Droit de rectification :</strong> modifier vos
              informations depuis les paramètres de votre compte
            </li>
            <li>
              <strong>Droit a l&apos;effacement :</strong> supprimer votre
              compte et toutes les données associées depuis les paramètres
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> exporter vos données au
              format JSON depuis les paramètres de votre compte
            </li>
            <li>
              <strong>Droit d&apos;opposition :</strong> vous opposer au
              traitement de vos données en supprimant votre compte
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Ce site utilise uniquement des cookies strictement nécessaires au
            fonctionnement du service d&apos;authentification. Aucun cookie de
            suivi, publicitaire ou analytique n&apos;est utilisé.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Nous mettons en oeuvre des mesures techniques appropriées pour
            protéger vos données : chiffrement des mots de passe, connexions
            HTTPS, contrôle d&apos;accès par utilisateur sur la base de données
            (Row Level Security).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
