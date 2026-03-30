import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Politique de confidentialite
      </h1>
      <p className="text-sm text-muted-foreground">
        Derniere mise a jour : mars 2026
      </p>

      <Card>
        <CardHeader>
          <CardTitle>1. Responsable du traitement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Le responsable du traitement des donnees personnelles est
            l&apos;editeur de la plateforme Challenge 48h.
          </p>
          <p>
            Pour toute question relative a vos donnees personnelles, vous pouvez
            nous contacter a l&apos;adresse :{" "}
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
          <CardTitle>2. Donnees collectees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Nous collectons les donnees suivantes :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Informations de compte :</strong> adresse email, nom
              complet, mot de passe (stocke sous forme chiffree)
            </li>
            <li>
              <strong>Conversations :</strong> messages echanges avec
              l&apos;assistant, titres des conversations
            </li>
            <li>
              <strong>Donnees techniques :</strong> cookies de session
              d&apos;authentification
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Finalites du traitement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-6">
            <li>Gestion de votre compte et authentification</li>
            <li>Fourniture du service de chat intelligent</li>
            <li>Sauvegarde de votre historique de conversations</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Destinataires des donnees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Supabase (hebergement)</p>
            <p>
              Vos donnees de compte et conversations sont hebergees par Supabase
              sur des serveurs situes dans l&apos;Union europeenne (region
              Francfort, Allemagne).
            </p>
          </div>
          <div>
            <p className="font-medium">Mistral AI (traitement des messages)</p>
            <p>
              Lorsque vous envoyez un message dans le chat, celui-ci est
              transmis a l&apos;API Mistral AI pour generer une reponse.
              L&apos;historique de la conversation en cours est egalement
              transmis pour assurer la coherence des reponses.
            </p>
            <p className="mt-2 rounded-md bg-muted p-3">
              <strong>Important :</strong> Dans le cadre du plan gratuit de
              Mistral AI, les donnees d&apos;entree et de sortie peuvent etre
              utilisees par Mistral pour ameliorer ses modeles. Ne partagez pas
              d&apos;informations sensibles ou personnelles dans le chat.
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
            donnees :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Sous-traitant</th>
                  <th className="py-2 pr-4 text-left font-medium">Role</th>
                  <th className="py-2 pr-4 text-left font-medium">Localisation</th>
                  <th className="py-2 text-left font-medium">DPA</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Supabase Inc.</td>
                  <td className="py-2 pr-4">Hebergement et authentification</td>
                  <td className="py-2 pr-4">UE (Francfort)</td>
                  <td className="py-2">Inclus dans les CGU Supabase</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Mistral AI</td>
                  <td className="py-2 pr-4">Traitement des messages (chat)</td>
                  <td className="py-2 pr-4">France / UE</td>
                  <td className="py-2">En cours de formalisation</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Vercel Inc.</td>
                  <td className="py-2 pr-4">Hebergement de l&apos;application</td>
                  <td className="py-2 pr-4">International (CDN)</td>
                  <td className="py-2">Inclus dans les CGU Vercel</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            Des accords de traitement des donnees (DPA) sont en cours de
            formalisation avec l&apos;ensemble de nos sous-traitants
            conformement a l&apos;article 28 du RGPD.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Duree de conservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Vos donnees sont conservees tant que votre compte est actif. En cas
            de suppression de votre compte, toutes vos donnees personnelles,
            conversations et messages sont definitivement supprimes de nos
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
            Conformement au Reglement General sur la Protection des Donnees
            (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Droit d&apos;acces :</strong> obtenir une copie de vos
              donnees personnelles
            </li>
            <li>
              <strong>Droit de rectification :</strong> modifier vos
              informations depuis les parametres de votre compte
            </li>
            <li>
              <strong>Droit a l&apos;effacement :</strong> supprimer votre
              compte et toutes les donnees associees depuis les parametres
            </li>
            <li>
              <strong>Droit a la portabilite :</strong> exporter vos donnees au
              format JSON depuis les parametres de votre compte
            </li>
            <li>
              <strong>Droit d&apos;opposition :</strong> vous opposer au
              traitement de vos donnees en supprimant votre compte
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
            Ce site utilise uniquement des cookies strictement necessaires au
            fonctionnement du service d&apos;authentification. Aucun cookie de
            suivi, publicitaire ou analytique n&apos;est utilise.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Securite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Nous mettons en oeuvre des mesures techniques appropriees pour
            proteger vos donnees : chiffrement des mots de passe, connexions
            HTTPS, controle d&apos;acces par utilisateur sur la base de donnees
            (Row Level Security).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
