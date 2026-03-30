# Audit complet de l'application -- v2

Date: 2026-03-28
Version precedente: v1 (2026-03-26)

## 1. Synthese executive

L'application a nettement progresse depuis l'audit v1. Plusieurs findings critiques ont ete corriges : l'API chat est desormais authentifiee, la suppression de compte passe par le service role admin et supprime reellement le compte auth.users, les headers de securite sont en place, et de nouvelles features ont ete ajoutees (prompts sauvegardes, selection de modeles/modes, themes de couleur, pages legales).

En revanche, deux problemes critiques sont apparus ou persistent : le middleware Next.js n'est pas fonctionnel (fichier et export mal nommes), et les routes API serveur utilisent `getSession()` au lieu de `getUser()` pour verifier l'authentification, ce qui ne valide pas le JWT cote Supabase. Le parcours de reinitialisation de mot de passe et la gestion de la confirmation email restent inchanges. Aucun rate limiting n'est en place.

Verdict global:
- Produit: bon pour un MVP, nouvelles features coherentes
- Technique: ameliore mais fragilise par le middleware casse
- Securite: progres reels, mais failles persistantes sur l'auth serveur
- Performance: correcte pour l'echelle actuelle
- Maintenabilite: insuffisante (0 test, pas de CI)

Note de maturite estimee: **6.5/10**
Evolution: legere amelioration par rapport a v1 (6/10), mais freinee par la regression du middleware

---

## 2. Perimetre et methode

Audit realise par lecture statique de l'ensemble du code source :
- Tous les fichiers TypeScript/TSX du projet (55 fichiers)
- Configuration : package.json, next.config.mjs, tsconfig.json, tailwind.config.ts
- Schema SQL : supabase/schema.sql
- Variables d'environnement : .env.local.example
- Comparaison systematique avec les 12 findings de l'audit v1

Non teste en runtime : build, lint, execution, requetes reelles.

---

## 3. Stack observee

- Next.js 16.2+ (App Router), React 18, TypeScript 5 (strict)
- Tailwind CSS 3.4 + shadcn/ui (Radix primitives)
- Supabase SSR 0.9 + supabase-js 2.100 (auth, BDD, RLS)
- Mistral API + OpenRouter API (streaming chat, rotation de cles)
- react-markdown + react-syntax-highlighter (rendu chat)
- next-themes (dark/light/system)
- Deploiement cible : Vercel

---

## 4. Points forts

- Architecture claire et bien decoupee : UI dans `components/`, logique Supabase dans `lib/supabase/`, logique IA dans `lib/ai/`, types dans `types/`.
- RLS correctement definie sur les 3 tables (`profiles`, `conversations`, `messages`) avec policies CRUD granulaires.
- Trigger automatique de creation de profil a l'inscription (`handle_new_user`).
- API chat maintenant protegee par verification de session (correction depuis v1).
- Suppression de compte reelle via admin API (correction depuis v1).
- Export de donnees RGPD fonctionnel (`/api/account/export`).
- Headers de securite en place : CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy (correction depuis v1).
- Systeme de rotation de cles API (jusqu'a 5 cles Mistral, 2 OpenRouter).
- Troncature intelligente des messages pour respecter les fenetres de contexte des modeles.
- Selection de mode (rapide/precis) avec modeles configures.
- Theming complet : dark/light/system + 7 couleurs d'accent avec persistence localStorage.
- Pages legales completes : politique de confidentialite detaillee, mentions legales.
- Bandeau cookies clarifie : indique clairement "cookies essentiels uniquement" et renvoie vers la politique.
- Empty states bien geres sur les pages prompts et chat.
- UX coherente avec shadcn/ui sur l'ensemble de l'application.
- Streaming SSE pour les reponses du chat.

---

## 5. Findings prioritaires

### CRITIQUE 1. Middleware Next.js non fonctionnel

**Statut:** NOUVEAU

Impact:
Le middleware de session Supabase n'est jamais execute. Next.js requiert un fichier nomme `middleware.ts` (pas `proxy.ts`) et un export nomme `middleware` (pas `proxy`). Sans middleware actif :
- Les cookies de session Supabase ne sont jamais rafraichis lors de la navigation
- Les sessions expirees ne sont pas detectees
- La redirection automatique (non-auth vers /login, auth vers /dashboard) ne fonctionne pas
- Les Server Components qui appellent `getSession()` lisent des cookies potentiellement perimes

Preuves:
- `src/proxy.ts:4`: la fonction exportee se nomme `proxy` et non `middleware`
- `src/proxy.ts:1`: le fichier se nomme `proxy.ts` et non `middleware.ts`
- Aucun fichier `src/middleware.ts` ou `middleware.ts` a la racine n'existe dans le projet

Recommandation:
- Renommer `src/proxy.ts` en `src/middleware.ts`
- Renommer l'export `proxy` en `middleware`

### CRITIQUE 2. getSession() utilise cote serveur au lieu de getUser()

**Statut:** NOUVEAU

Impact:
`getSession()` lit le JWT depuis les cookies sans le verifier aupres de Supabase. Un attaquant pourrait forger ou modifier un cookie de session. La documentation Supabase recommande explicitement d'utiliser `getUser()` dans les routes API et Server Components pour une verification authentifiee. `getSession()` ne doit etre utilise que dans le middleware pour un check rapide.

Preuves:
- `src/app/api/chat/route.ts:17`: `supabase.auth.getSession()` dans une route API critique
- `src/app/api/account/delete/route.ts:7`: `supabase.auth.getSession()` pour une operation de suppression irreversible
- `src/app/api/account/export/route.ts:6`: `supabase.auth.getSession()` pour l'export de donnees personnelles
- `src/app/dashboard/page.tsx:10`: `supabase.auth.getSession()` dans un Server Component

Recommandation:
- Remplacer `getSession()` par `getUser()` dans toutes les routes API et Server Components
- Conserver `getSession()` uniquement dans le middleware (une fois corrige)

### ELEVE 3. Reinitialisation de mot de passe toujours inachevee

**Statut:** PERSISTENT depuis v1

Impact:
Le lien de reinitialisation renvoie vers `/login` au lieu d'une page dediee. L'utilisateur ne peut pas definir un nouveau mot de passe apres avoir clique sur le lien dans l'email.

Preuves:
- `src/app/(auth)/forgot-password/page.tsx:33`: `redirectTo` pointe vers `${window.location.origin}/login`
- Aucune route `/reset-password` ou `/update-password` n'existe

Recommandation:
Inchangee depuis v1 : creer une page dediee qui detecte le mode recovery et appelle `supabase.auth.updateUser({ password })`.

### ELEVE 4. Inscription non geree si confirmation email activee

**Statut:** PERSISTENT depuis v1

Impact:
Apres `signUp`, redirection directe vers `/dashboard` sans verifier si une confirmation email est requise. Si Supabase exige une confirmation, l'utilisateur arrive sur le dashboard sans session.

Preuves:
- `src/app/(auth)/register/page.tsx:56`: `router.push("/dashboard")` sans verification du champ `session` dans la reponse `signUp`

Recommandation:
Inchangee depuis v1 : verifier la reponse `signUp` et afficher un ecran "verifiez votre email" si la session est null.

### ELEVE 5. Aucun rate limiting sur les routes API

**Statut:** NOUVEAU (mentionne dans les recommandations v1 mais jamais traite comme finding distinct)

Impact:
Les trois routes API (`/api/chat`, `/api/account/delete`, `/api/account/export`) n'ont aucune limitation de debit. Un utilisateur authentifie ou un script automatise peut :
- Consommer les cles API de maniere illimitee (denial of wallet)
- Supprimer/exporter des comptes en boucle
- Saturer le serveur

Preuves:
- `src/app/api/chat/route.ts`: aucun mecanisme de rate limiting
- `src/app/api/account/delete/route.ts`: aucun mecanisme de rate limiting
- `src/app/api/account/export/route.ts`: aucun mecanisme de rate limiting

Recommandation:
Implementer un rate limiting simple (par IP ou par user ID) via un middleware ou une librairie comme `next-rate-limit`, ou utiliser les limites au niveau de Vercel/reverse proxy.

---

## 6. Findings secondaires

### MOYEN 6. Historique chat toujours reconstruit cote client

**Statut:** PERSISTENT depuis v1

Impact:
Le client construit et envoie l'integralite de l'historique des messages au serveur. Le serveur ne verifie ni la provenance, ni la coherence, ni la taille de l'historique. Un client modifie pourrait injecter un historique arbitraire.

Preuves:
- `src/app/dashboard/chat/page.tsx:170-173`: construction de `messageHistory` cote client
- `src/app/api/chat/route.ts:25-28`: le serveur utilise `messages` tel quel depuis le body

Recommandation:
Transmettre uniquement `conversation_id` et le nouveau message. Reconstruire l'historique cote serveur depuis Supabase.

### MOYEN 7. Validation des variables d'environnement toujours fragile

**Statut:** PERSISTENT depuis v1 (partiellement ameliore)

Impact:
En cas de configuration manquante, l'app produit des erreurs diffuses au lieu de planter clairement au demarrage.

Preuves:
- `src/lib/supabase/client.ts:13`: retourne `{} as SupabaseClient` si les envs manquent — faux client silencieux
- `src/lib/supabase/server.ts:8-9`: fallback `?? ""` sur les envs — client Supabase avec URL vide
- `src/lib/supabase/admin.ts:5-6`: non-null assertions `!` sans verification prealable
- `src/lib/supabase/middleware.ts:8-9`: non-null assertions `!` sans verification prealable

Recommandation:
Centraliser une validation stricte des envs (par exemple dans un fichier `lib/env.ts`) qui leve une erreur explicite si une variable requise est absente.

### MOYEN 8. Bug de loader dans handleUpdateProfile

**Statut:** NOUVEAU

Impact:
Si `userId` est null au moment de la soumission du formulaire profil, la fonction retourne sans remettre `loading` a `false`. Le bouton reste desactive indefiniment.

Preuves:
- `src/app/dashboard/settings/page.tsx:71`: `if (!userId) return;` apres `setLoading(true)` a la ligne 69

Recommandation:
Utiliser un pattern `try/finally` ou remettre `setLoading(false)` avant chaque `return` premature.

### MOYEN 9. Pas de limite de taille sur les messages chat

**Statut:** NOUVEAU

Impact:
L'API chat ne verifie pas la taille du contenu des messages. Un client pourrait envoyer des payloads extremement volumineux, causant une surconsommation de tokens et potentiellement un timeout ou un crash.

Preuves:
- `src/app/api/chat/route.ts:27`: verification `Array.isArray(messages)` uniquement, aucun check sur la taille
- `src/app/dashboard/chat/page.tsx:366-374`: le textarea n'a pas de `maxLength`

Recommandation:
Ajouter une validation cote serveur : taille max par message (ex: 10 000 caracteres), nombre max de messages dans l'historique.

### MOYEN 10. CSP affaiblie par unsafe-inline et unsafe-eval

**Statut:** NOUVEAU

Impact:
La Content Security Policy autorise `'unsafe-inline'` et `'unsafe-eval'` dans `script-src`, ce qui reduit significativement la protection contre les attaques XSS. Toutefois, Next.js necessite `unsafe-inline` pour ses scripts inline, et `unsafe-eval` est souvent requis en mode dev.

Preuves:
- `next.config.mjs:16`: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

Recommandation:
En production, remplacer `unsafe-inline` par des nonces CSP (Next.js les supporte) et retirer `unsafe-eval`. Conserver `unsafe-eval` uniquement en dev si necessaire.

### MOYEN 11. Suppression de prompt sans confirmation

**Statut:** NOUVEAU

Impact:
Le bouton de suppression d'un prompt execute l'action immediatement, sans dialogue de confirmation. Un clic accidentel supprime definitivement le prompt.

Preuves:
- `src/app/dashboard/prompts/page.tsx:154-156`: `handleDelete` supprime directement sans confirmation
- `src/app/dashboard/prompts/page.tsx:360-365`: le bouton appelle `handleDelete` au clic

Recommandation:
Ajouter un dialogue de confirmation (comme pour la suppression de compte) ou un mecanisme d'annulation (undo toast).

### MOYEN 12. Table `prompts` absente du schema SQL

**Statut:** NOUVEAU

Impact:
Le schema SQL (`supabase/schema.sql`) ne contient pas la table `prompts`, alors que l'app l'utilise activement. Toute reinstallation ou replication de la base depuis le schema sera incomplete.

Preuves:
- `supabase/schema.sql`: seules les tables `profiles`, `conversations` et `messages` sont definies
- `src/app/dashboard/prompts/page.tsx`, `src/components/prompt-picker.tsx`, `src/app/dashboard/page.tsx:21`: la table `prompts` est utilisee partout

Recommandation:
Ajouter la table `prompts` avec ses policies RLS au schema SQL. S'assurer que les policies limitent l'acces aux prompts de l'utilisateur authentifie.

### MOYEN 13. Dashboard page SSR sans protection si session absente

**Statut:** NOUVEAU

Impact:
Le Server Component `dashboard/page.tsx` appelle `getSession()` et utilise `userId` (potentiellement `undefined`) dans ses requetes sans verifier que la session existe. Sans middleware actif, un utilisateur non authentifie peut atteindre cette page et declencher des requetes invalides.

Preuves:
- `src/app/dashboard/page.tsx:10-11`: `userId` est extrait sans verification de nullite
- `src/app/dashboard/page.tsx:13-24`: les requetes Supabase sont executees avec un `userId` potentiellement undefined

Recommandation:
Ajouter une verification explicite de la session et rediriger vers `/login` si absente, en complement de la correction du middleware.

### FAIBLE 14. Navigation items dupliques entre sidebar et mobile-sidebar

**Statut:** NOUVEAU

Impact:
Risque de desynchronisation entre les deux menus si un item est ajoute ou modifie dans un seul des deux fichiers.

Preuves:
- `src/components/sidebar.tsx:9-14`: definition de `navItems`
- `src/components/mobile-sidebar.tsx:14-19`: definition identique de `navItems`

Recommandation:
Extraire `navItems` dans un fichier partage (`lib/navigation.ts` ou similaire).

### FAIBLE 15. Aucun test

**Statut:** PERSISTENT depuis v1

Impact:
Aucun test unitaire, d'integration ou e2e n'est present dans le projet. Les regressions ne sont detectees que manuellement.

Preuves:
- Aucun fichier `*.test.*` ou `*.spec.*` dans le projet
- Aucune dependance de test dans package.json (pas de jest, vitest, playwright, etc.)

Recommandation:
Ajouter au minimum des tests sur les flux critiques : auth (login, register, signout), API chat, suppression de compte.

### FAIBLE 16. Variable `body` redeclaree dans la route chat

**Statut:** NOUVEAU

Impact:
La variable `body` est declaree deux fois dans la meme fonction : une fois pour le request body (ligne 18) et une fois pour le response body (ligne 45). Cela compile car la seconde est un `const` dans un scope different, mais c'est confus et source d'erreurs futures.

Preuves:
- `src/app/api/chat/route.ts:18`: `body` pour le contenu de la requete
- `src/app/api/chat/route.ts:45`: `body` pour le stream de reponse

Recommandation:
Renommer la seconde variable (ex: `stream` ou `responseBody`).

---

## 7. Produit et UX

Ce que l'app fait bien:
- Interface coherente et moderne grace a shadcn/ui
- Parcours utilisateur clair : inscription, login, dashboard, chat, settings
- Chat fonctionnel avec streaming, selection de modeles, et prompts reutilisables
- Personnalisation poussee (7 themes de couleur, mode sombre)
- Export de donnees et suppression de compte accessibles depuis les parametres
- Pages legales completes et detaillees (confidentialite, mentions legales)
- Empty states bien travailles sur chat et prompts
- Navigation responsive (sidebar desktop, sheet mobile)

Ce qui manque pour passer un cap:
- Parcours reset password fonctionnel
- Feedback post-inscription si confirmation email requise
- Confirmation avant suppression d'un prompt
- Renommage de conversations
- Pagination sur les messages (actuellement pas de limite)
- Indicateur de statut de session / reconnexion automatique

---

## 8. Securite et conformite

Points positifs:
- RLS bien definie sur les 3 tables avec policies CRUD completes
- Suppression de compte reelle via admin API (corrige depuis v1)
- API chat authentifiee (corrige depuis v1)
- Headers de securite en place : CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Aucun tracking externe, cookies essentiels uniquement
- Politique de confidentialite detaillee avec tableau des sous-traitants
- Consentement RGPD a l'inscription (checkbox obligatoire)
- Export de donnees fonctionnel

Points faibles:
- Middleware inactif : les sessions ne sont jamais rafraichies, les redirections de protection ne fonctionnent pas
- `getSession()` au lieu de `getUser()` dans les routes API : le JWT n'est pas verifie cote serveur
- Aucun rate limiting
- CSP avec `unsafe-inline` et `unsafe-eval`
- Pas de validation de taille sur les payloads chat
- Schema SQL incomplet (table `prompts` manquante — policies RLS potentiellement absentes en production)

---

## 9. Performance et architecture

Points positifs:
- Architecture legere et bien structuree
- Streaming SSE pour le chat (bonne UX)
- Troncature intelligente des messages avant envoi au modele
- Rotation de cles API pour distribuer la charge
- `Promise.all` pour paralleliser les requetes independantes (dashboard, chat init, export)
- Lazy loading du theme couleur via script inline dans `<head>`
- `loading.tsx` present pour le dashboard
- Limite de 30 conversations chargees dans la sidebar

Points d'attention:
- `react-syntax-highlighter` est une dependance lourde (~500KB) importee de maniere synchrone dans `code-block.tsx`
- Messages charges sans pagination ni limite (`loadMessages` dans chat/page.tsx)
- `force-dynamic` sur la home page et le dashboard — empeche tout cache statique
- Pas de Suspense boundaries au-dela du `loading.tsx` racine du dashboard
- Chaque page du dashboard fait un appel `getSession()` + requete profil separement (pas de cache partage)

---

## 10. Maintenabilite

Niveau actuel: correct pour un developpeur solo a court terme, insuffisant pour collaborer ou scaler.

Freins principaux:
- 0 test (aucune dependance de test installee)
- 0 CI/CD (pas de GitHub Actions, pas de checks pre-merge)
- Schema SQL incomplet (table `prompts` manquante)
- Code duplique (navItems dans sidebar + mobile-sidebar)
- README probablement encore celui de create-next-app
- Pas de linting strict au-dela d'ESLint de base
- Pas d'observabilite : aucun log structure, aucun monitoring, aucune alerte

---

## 11. Bilan des corrections v1 -> v2

| # | Finding v1 | Priorite | Statut v2 |
|---|-----------|----------|-----------|
| 1 | API chat sans controle d'acces | CRITIQUE | CORRIGE — auth check en place |
| 2 | Suppression de compte trompeuse | CRITIQUE | CORRIGE — admin.deleteUser() |
| 3 | Reset password inacheve | ELEVE | PERSISTENT — toujours pas de page dediee |
| 4 | Inscription sans gestion confirmation email | ELEVE | PERSISTENT — redirect directe |
| 5 | Variables d'env fragiles | ELEVE | PERSISTENT (partiellement) — faux client et fallbacks toujours presents |
| 6 | Chat base sur confiance client | MOYEN | PERSISTENT — historique toujours envoye par le client |
| 7 | HTML invalide (button dans button) | MOYEN | CORRIGE — remplace par div role=button |
| 8 | Gestion d'erreur et loaders inegale | MOYEN | PARTIELLEMENT CORRIGE — nouveau bug loader settings |
| 9 | Documentation insuffisante | MOYEN | PERSISTENT — README non mis a jour |
| 10 | Bandeau cookies peu credible | FAIBLE | CORRIGE — clarifie "cookies essentiels" + lien privacy |
| 11 | Configuration securite minimale | FAIBLE | CORRIGE — headers CSP, X-Frame-Options, etc. |
| 12 | Qualite de finition MVP | FAIBLE | AMELIORE — prompts, themes, modes, pages legales |

Bilan : 4 corriges, 2 ameliores, 5 persistants, 1 partiellement corrige.

---

## 12. Plan d'action recommande

### Priorite immediate

1. Renommer `src/proxy.ts` en `src/middleware.ts` et l'export `proxy` en `middleware` pour reactiver le middleware Next.js.
2. Remplacer `getSession()` par `getUser()` dans les 3 routes API et le Server Component dashboard.
3. Ajouter une verification explicite de session dans `dashboard/page.tsx` avec redirect si absente.
4. Renommer la variable `body` redeclaree dans `src/app/api/chat/route.ts`.

### Priorite court terme

5. Creer la page de reinitialisation de mot de passe (reset-password) et mettre a jour le `redirectTo`.
6. Gerer le cas confirmation email dans le flow d'inscription.
7. Ajouter rate limiting sur les routes API (au minimum `/api/chat`).
8. Ajouter la table `prompts` et ses policies RLS au schema SQL.
9. Ajouter une validation de taille sur les messages (cote serveur).
10. Centraliser la validation des variables d'environnement.

### Priorite moyen terme

11. Reconstruire l'historique chat cote serveur (transmettre conversation_id seulement).
12. Remplacer `unsafe-eval` dans la CSP de production (utiliser les nonces Next.js).
13. Ajouter un dialogue de confirmation pour la suppression de prompts.
14. Extraire `navItems` dans un fichier partage.
15. Installer un framework de test (vitest) et ecrire des tests sur les flux critiques.
16. Mettre en place une CI minimale (lint + build + tests).
17. Ajouter de la pagination sur le chargement des messages.

---

## 13. Conclusion

Le projet a clairement progresse depuis v1 : les deux findings critiques (API non protegee, suppression de compte factice) sont corriges, les headers de securite sont en place, et le produit s'est enrichi de features coherentes (prompts, themes, modes, pages legales). L'effort est visible et la direction est bonne.

Cependant, le middleware casse annule une partie du benefice de la protection ajoutee : les sessions ne sont pas rafraichies, et l'utilisation de `getSession()` en serveur rend la verification d'identite contournable. Ces deux points sont les corrections les plus urgentes — et aussi les plus simples a faire. Une fois le middleware et `getUser()` en place, le projet aura un socle de securite solide pour la suite.
