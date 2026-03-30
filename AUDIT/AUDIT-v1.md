# Audit complet de l'application

Date: 2026-03-26

## 1. Synthese executive

L'application presente une base MVP saine pour un chat authentifie avec Next.js, Supabase et Mistral. La structure est lisible, l'UX est deja exploitable, les policies RLS de la base sont globalement bien posees, et l'ensemble donne une impression de produit fonctionnel.

En revanche, plusieurs flux critiques ne sont pas encore au niveau d'une mise en production:

- l'API IA est appelable sans verification d'authentification ni garde-fou de consommation;
- la suppression de compte ne supprime pas reellement le compte d'authentification;
- le parcours de reinitialisation de mot de passe est incomplet;
- l'inscription ne gere pas correctement le cas de confirmation email;
- la gestion des variables d'environnement degrade en erreurs runtime peu lisibles.

Verdict global:

- Produit: prometteur, coherent pour un MVP.
- Technique: base propre mais encore fragile sur les flux critiques.
- Securite: insuffisante pour une production ouverte.
- Maintenabilite: correcte a court terme, insuffisamment outillee pour evoluer vite et proprement.

Note de maturite estimee: 6/10

## 2. Perimetre et methode

Audit realise par lecture statique du projet:

- stack et configuration;
- parcours auth, dashboard, chat, settings;
- API IA et integration Supabase;
- schema SQL et RLS;
- hygiene projet et documentation.

Limite importante:

- verification `lint` et `build` non executee, car le sandbox ne dispose pas de `node`, `npm` ou `npx`.

## 3. Stack observee

- Frontend/app: Next.js 14 App Router, React 18, TypeScript, Tailwind, shadcn/ui, Radix
- Auth et DB: Supabase SSR + policies RLS
- IA: API Mistral en streaming
- Donnees metier: `profiles`, `conversations`, `messages`

## 4. Points forts

- Architecture simple et compréhensible, adaptee a un MVP.
- Separation assez nette entre UI, auth, API et integration tiers.
- Middleware de session present et protection du dashboard cote routing.
- Schema SQL propre avec policies RLS pertinentes sur `profiles`, `conversations` et `messages`.
- UX globale deja lisible: auth, dashboard, chat, settings, mode sombre, responsive de base.
- L'app persiste conversations et messages, ce qui donne une vraie valeur produit des maintenant.

## 5. Findings prioritaires

### Critique 1. API IA exposée sans controle d'acces

Impact:

- n'importe qui peut potentiellement appeler `/api/chat` et consommer la cle Mistral;
- absence de controle utilisateur, quota, limitation ou association a une conversation;
- risque de surcout, abus automatises, denial of wallet et charge inutile.

Preuves:

- `src/app/api/chat/route.ts:4-35`: aucun controle de session, aucun check utilisateur, aucune validation forte;
- `src/lib/supabase/middleware.ts:32-54`: le middleware ne protege que `/dashboard` et les pages auth, pas `/api/chat`.

Recommandation:

- exiger une session valide cote serveur dans la route API;
- relier la requete a un `conversation_id` et a l'utilisateur courant;
- reconstruire l'historique cote serveur depuis la base au lieu de faire confiance integralement au client;
- ajouter rate limiting, taille max d'input et logs d'usage.

### Critique 2. "Suppression de compte" trompeuse et incomplete

Impact:

- l'UI annonce une suppression irreversible du compte;
- en realite, seul le profil applicatif est supprime, puis l'utilisateur est deconnecte;
- le compte `auth.users` Supabase n'est pas supprime, donc l'utilisateur peut potentiellement se reconnecter;
- fort risque produit, support et conformite.

Preuves:

- `src/app/dashboard/settings/page.tsx:98-111`: suppression de `profiles`, puis `signOut`, sans suppression du compte auth;
- `src/app/dashboard/settings/page.tsx:179-197`: promesse explicite de suppression definitive.

Recommandation:

- implementer une suppression serveur via service role/admin API;
- supprimer `auth.users` et laisser les cascades nettoyer les donnees liees;
- tant que ce n'est pas fait, changer le wording pour ne pas promettre une suppression complete.

### Eleve 3. Reinitialisation de mot de passe inachevee

Impact:

- l'utilisateur peut demander un email de reset, mais l'app ne fournit pas le vrai parcours de recuperation;
- le lien renvoie vers `/login`, sans page de mise a jour du mot de passe;
- experience casse ou confuse selon la configuration Supabase.

Preuves:

- `src/app/(auth)/forgot-password/page.tsx:32-34`: `redirectTo` pointe vers `/login`;
- aucune route dediee de type `reset-password` / `update-password` n'existe dans `src/app`.

Recommandation:

- creer une page dediee au mode recovery;
- y verifier la session de recovery puis appeler `supabase.auth.updateUser({ password })`;
- ajuster le template email et le `redirectTo`.

### Eleve 4. Inscription mal geree si confirmation email active

Impact:

- apres `signUp`, l'app redirige directement vers `/dashboard`;
- si Supabase exige une confirmation email, aucune session n'est disponible;
- l'utilisateur est renvoye par le middleware, avec une UX incoherente.

Preuves:

- `src/app/(auth)/register/page.tsx:41-56`: aucune verification de session ou de besoin de confirmation.

Recommandation:

- lire la reponse `signUp` et distinguer:
  - compte cree + session active;
  - compte cree + confirmation email requise;
- afficher un ecran "verifiez votre email" si necessaire.

### Eleve 5. Gestion des variables d'environnement fragile

Impact:

- en cas de mauvaise configuration, certaines parties retournent un faux client Supabase ou utilisent des valeurs forcees;
- cela produit des erreurs runtime diffuses et difficiles a diagnostiquer.

Preuves:

- `src/lib/supabase/client.ts:12-14`: retourne `{}` caste en `SupabaseClient`;
- `src/lib/supabase/middleware.ts:7-9`: non-null assertions sur les variables d'environnement;
- `src/lib/supabase/server.ts`: fallback sur chaine vide.

Recommandation:

- centraliser une validation stricte des envs au demarrage;
- lever une erreur explicite et immediate si la config est absente;
- ne jamais retourner un faux client caste.

## 6. Findings secondaires

### Moyen 6. Flux chat trop base sur la confiance client

Impact:

- le client construit l'historique envoye au modele;
- le serveur ne verifie ni provenance, ni longueur, ni cohérence conversationnelle;
- impossible de garantir integrite fonctionnelle, quotas ou audit trail robuste.

Preuves:

- `src/app/dashboard/chat/page.tsx:163-174`
- `src/app/api/chat/route.ts:6-20`

Recommandation:

- transmettre seulement `conversation_id` et `message`;
- reconstruire l'historique serveur depuis Supabase.

### Moyen 7. Accessibilite/HTML invalide dans la liste des conversations

Impact:

- un `button` est imbrique dans un autre `button`;
- cela peut casser navigation clavier, lecteurs d'ecran et comportements navigateur.

Preuves:

- `src/app/dashboard/chat/page.tsx:292-307`

Recommandation:

- remplacer le bouton parent par un conteneur cliquable accessible ou une ligne avec actions separees.

### Moyen 8. Gestion d'erreur et d'etat inegale sur plusieurs flux

Impact:

- certains retours anticipes laissent des loaders potentiellement bloques;
- peu de messages d'erreur contextualises;
- peu de traitement des erreurs Supabase cote client.

Preuves:

- `src/app/dashboard/settings/page.tsx:65-68` et `100-103`: retour sans remettre `loading`/`deleteLoading` a `false`;
- `src/app/dashboard/chat/page.tsx`: peu de branches d'erreur sur fetch/insert/delete.

Recommandation:

- normaliser les etats de chargement avec `try/finally`;
- journaliser les erreurs cote client ou les remonter via toast/alert plus precis.

### Moyen 9. Documentation produit et technique insuffisante

Impact:

- `README.md` reste celui de `create-next-app`;
- absence de procedure de setup, architecture, flux auth, schema de donnees, checklist de deploy.

Recommandation:

- ecrire un README projet minimal mais reel;
- documenter envs, schema Supabase, parcours auth, scripts et limites connues.

### Faible 10. Bandeau cookies peu credible juridiquement

Impact:

- le refus n'a pas d'effet concret sur le fonctionnement;
- l'app stocke quand meme un consentement en `localStorage`;
- aucune page politique de confidentialite ou details de cookies.

Preuves:

- `src/components/cookie-consent.tsx`

Recommandation:

- soit supprimer le bandeau si seuls cookies strictement necessaires sont utilises;
- soit clarifier sa finalite et relier a une vraie politique.

### Faible 11. Configuration securite/front minimale

Constat:

- `next.config.mjs` est vide;
- pas de headers de securite visibles;
- metadonnees SEO/social minimales.

Recommandation:

- ajouter au minimum des headers de securite adaptes au projet;
- enrichir `metadata` si l'app a vocation publique.

### Faible 12. Qualite de finition encore MVP

Constats:

- page de chat sans auto-selection de la conversation la plus recente;
- textes et placeholders encore rudimentaires;
- quelques caracteres accentues apparaissent degrades dans certaines sorties console;
- composants/tests absents pour verrouiller les regressions.

## 7. Produit et UX

Ce que l'app fait bien:

- onboarding simple;
- interface propre et immediate;
- chat central, sans complexite inutile;
- dashboard clair pour un premier niveau de produit.

Ce qui manque pour passer un cap:

- statut clair apres inscription;
- reset password complet;
- suppression de compte conforme a la promesse;
- etat vide et etats d'erreur plus travailles;
- historique chat mieux guide (selection, renommage, reprise de conversation).

## 8. Securite et conformite

Points positifs:

- RLS correctement pensee sur les tables principales;
- les operations de donnees utilisateur passent bien par Supabase et non par un backend bricolé.

Points faibles:

- endpoint IA public;
- absence de throttling/quotas;
- suppression de compte incomplete;
- validation d'entrees tres legere;
- configuration env et headers trop permissive pour une exposition publique.

## 9. Performance et architecture

Points positifs:

- architecture legere, peu de dette structurelle a ce stade;
- usage de streaming pour le chat, bon choix UX.

Points d'attention:

- beaucoup de logique metier reside cote client;
- plusieurs appels `auth.getUser()` et requetes profile separées;
- aucune instrumentation perf/erreur;
- pas de test ou pipeline de verification observe.

## 10. Maintenabilite

Niveau actuel:

- bon pour avancer vite a court terme;
- insuffisant pour monter en charge equipe/produit sans filet.

Freins principaux:

- absence de tests;
- documentation quasi inexistante;
- erreurs et cas limites peu cadres;
- logique critique distribuee entre client et serveur sans contrats forts.

## 11. Plan d'action recommande

### Priorite immediate

1. Proteger `/api/chat` par session serveur.
2. Ajouter rate limiting et validation stricte des payloads.
3. Corriger le wording ou implementer la vraie suppression de compte.
4. Implementer un vrai flow de reset password.
5. Corriger le flow d'inscription avec confirmation email.

### Priorite court terme

1. Centraliser la validation des variables d'environnement.
2. Durcir la gestion d'erreurs et des loaders.
3. Corriger l'accessibilite de la liste des conversations.
4. Ecrire un README projet reel.
5. Ajouter quelques tests critiques e2e ou integration sur auth/chat/settings.

### Priorite moyen terme

1. Recomposer l'historique chat cote serveur.
2. Ajouter observabilite minimale: logs d'erreur, analytics d'usage, suivi IA.
3. Poser une base de qualite: lint strict, CI, checks pre-merge.
4. Revoir legal/compliance selon la cible reelle du produit.

## 12. Conclusion

Mon avis: l'app est bonne pour un sprint court ou une demo convaincante. Elle montre une intention produit claire et une execution rapide plutot propre. Le probleme n'est pas la base technique generale; le probleme est que les flux sensibles ne sont pas encore verrouilles.

Si tu veux la faire passer d'un MVP credible a une app publiable, concentre-toi d'abord sur:

- securiser l'acces au chat IA;
- fiabiliser auth et recovery;
- rendre la suppression de compte honnete et correcte;
- poser un minimum de validation, tests et documentation.
