# Audit complet de l'application -- v1

Date: 2026-04-03
Version precedente: aucune

## 1. Synthese executive

TaskFlow est une application de gestion de projet gamifiee, fonctionnelle et bien structuree pour un projet ne d'un Challenge 48h. L'architecture Next.js App Router + Supabase est correctement mise en oeuvre avec une bonne separation Server/Client Components. Le systeme de gamification (XP, niveaux, badges, leaderboard) est operationnel.

Les principaux risques identifies sont : l'absence de fichier middleware.ts a la racine (les sessions ne sont pas rafraichies et les routes ne sont pas protegees cote serveur), une CSP permissive (`unsafe-inline`, `unsafe-eval`), l'absence totale de tests automatises et de CI/CD, et plusieurs composants surdimensionnes (settings: 578 lignes). Le systeme de streaks et le heatmap d'activite ne fonctionnent pas car la table `activity_log` et la fonction RPC `get_user_streak` n'existent pas.

Verdict global:
- Produit: Bon — CRUD complet, gamification fonctionnelle, UX coherente en francais
- Technique: Moyen — bonne architecture mais composants trop gros, pas de tests, middleware manquant
- Securite: Insuffisant — middleware absent, CSP faible, pas de rate limiting, pas de validation longueur
- Performance: Correct — pas de fuite majeure, mais pas d'optimisation (useMemo, dynamic imports)
- Maintenabilite: Faible — zero tests, zero CI/CD, code duplique, pas de logging

Note de maturite estimee: **4.5/10**

---

## 2. Perimetre et methode

Audit transversal couvrant l'ensemble du code source (src/, mcp/, supabase/), la configuration (next.config.mjs, tsconfig.json, package.json), la documentation (docs/, CLAUDE.md, README.md), et les pages legales.

Methode : lecture exhaustive des fichiers critiques, recherche par patterns (grep) pour les anti-patterns, verification des flux utilisateur de bout en bout, analyse des migrations Supabase.

---

## 3. Stack observee

| Technologie | Version |
|------------|---------|
| Next.js | 16.2.1 |
| React | 18.x |
| TypeScript | 5.x (strict: true) |
| Tailwind CSS | 3.4.1 |
| Supabase JS | 2.100.0 |
| Supabase SSR | 0.9.0 |
| @dnd-kit/core | 6.3.1 |
| @modelcontextprotocol/sdk | 1.28.0 |
| shadcn/ui (Radix) | multiple packages |
| sonner | 2.0.7 |
| lucide-react | 1.6.0 |
| ESLint | 9.x (next/core-web-vitals + next/typescript) |
| Node types | 20.x |

---

## 4. Points forts

- **Architecture App Router bien utilisee** : Server Components pour le data fetching (dashboard, projects, project detail), Client Components reserves aux interactions (kanban, formulaires, dialogs).
- **Supabase triple client** : browser, server, admin — chaque contexte a son propre client avec les bonnes credentials.
- **Gamification complete** : XP triggers en base, niveaux exponentiels, 12 badges avec progression, leaderboard global et par equipe, realtime via subscriptions Supabase.
- **RLS active sur toutes les tables** avec helper functions `is_project_member()` et `is_project_owner()`.
- **MCP server bien structure** : 17 tools, 2 resources, 3 prompts, chaque tool dans un fichier separe, validation Zod sur tous les inputs.
- **Authentification MCP par user** (pas service role) — les policies RLS s'appliquent.
- **UI coherente en francais** avec shadcn/ui partout, responsive design avec sidebar mobile.
- **Empty states** geres sur la plupart des ecrans (projets vides, colonnes kanban vides, leaderboard vide).
- **Pages legales completes** (mentions legales, politique de confidentialite RGPD).
- **Fichiers .env non versionnes** (.gitignore couvre `.env` et `.env*.local`).
- **TypeScript strict sans `any`** dans le code source applicatif.

---

## 5. Findings prioritaires

### CRITIQUE 1. Middleware Next.js inexistant

**Statut:** NOUVEAU

Impact:
Aucun fichier `middleware.ts` n'existe a la racine du projet ni dans `src/`. La logique de middleware est definie dans `src/lib/supabase/middleware.ts` et exposee via `src/lib/proxy.ts`, mais jamais importee comme middleware Next.js. Les sessions Supabase ne sont donc jamais rafraichies cote serveur, et la protection des routes `/dashboard/*` n'est pas active.

Preuves:
- Absence de `middleware.ts` a la racine et dans `src/` (verifie par filesystem)
- `src/lib/proxy.ts:1-12`: exporte `proxy` et `config` mais n'est reference par aucun middleware Next.js
- `src/lib/supabase/middleware.ts:32-48`: logique de redirection pour routes protegees, jamais executee

Recommandation:
Creer `src/middleware.ts` (ou a la racine) :
```typescript
export { proxy as middleware } from "@/lib/proxy";
export { config } from "@/lib/proxy";
```

---

### CRITIQUE 2. CSP permissive avec unsafe-inline et unsafe-eval

**Statut:** NOUVEAU

Impact:
La Content-Security-Policy autorise `'unsafe-inline'` et `'unsafe-eval'` pour les scripts, rendant la CSP inefficace contre les attaques XSS. Un attaquant injectant du contenu pourrait executer du JavaScript arbitraire.

Preuves:
- `next.config.mjs:16`: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- `next.config.mjs:17`: `style-src 'self' 'unsafe-inline'`

Recommandation:
Utiliser le support natif des nonces CSP de Next.js (disponible depuis v15.2+) pour remplacer `unsafe-inline`. Si `unsafe-eval` est requis par une dependance, le documenter explicitement. Ajouter `Strict-Transport-Security` et `Permissions-Policy`.

---

### CRITIQUE 3. Table activity_log et fonction get_user_streak inexistantes

**Statut:** NOUVEAU

Impact:
Le dashboard reference la table `activity_log` et la fonction RPC `get_user_streak`, mais aucune migration ne les cree. Le heatmap d'activite affiche toujours un tableau vide. Le streak affiche toujours "0 jours". Les 2 badges de streak (Regular, Diligent) sont impossibles a debloquer.

Preuves:
- `src/app/dashboard/page.tsx:85-89`: query sur `activity_log` qui n'existe pas
- `src/app/dashboard/page.tsx:67`: appel `supabase.rpc("get_user_streak", ...)` — fonction non definie
- `src/lib/badges.ts:120-137`: badges Regular (3j streak) et Diligent (7j streak) non deblocables
- `supabase/migrations/`: aucune migration pour `activity_log`

Recommandation:
Creer une migration avec la table `activity_log` (user_id, activity_date, count), la fonction `get_user_streak()`, et un trigger pour inserer une ligne a chaque completion de tache.

---

### ELEVE 4. Aucun rate limiting sur les API routes

**Statut:** NOUVEAU

Impact:
Les deux API routes (`/api/account/delete` et `/api/account/export`) n'ont aucun mecanisme de limitation de debit. Un utilisateur malveillant pourrait spammer la suppression de comptes (echecs repetes) ou generer des exports massifs, impactant la base de donnees.

Preuves:
- `src/app/api/account/delete/route.ts`: aucun rate limiting
- `src/app/api/account/export/route.ts`: aucun rate limiting ni limite de taille

Recommandation:
Implementer un rate limiting via Vercel Edge Config, `next-rate-limit`, ou un compteur Redis/KV. Limiter a 3 tentatives de suppression par heure et 5 exports par jour.

---

### ELEVE 5. Pas de validation de longueur sur les inputs

**Statut:** NOUVEAU

Impact:
Les formulaires de creation de projets, taches, et invitations ne valident pas la longueur maximale des champs. Un utilisateur pourrait soumettre des titres de plusieurs milliers de caracteres, impactant l'affichage et le stockage.

Preuves:
- `src/components/projects/create-project-dialog.tsx:50`: seul check `!name.trim()`
- `src/components/projects/create-task-dialog.tsx:59`: seul check `!title.trim()`
- `mcp/tools/create-task.ts:6`: schema Zod `z.string()` sans `.min()` ni `.max()`
- `mcp/tools/invite-member.ts:6`: `z.string()` sans `.email()` pour l'email

Recommandation:
Ajouter des contraintes `maxLength` sur les inputs HTML et `.min(1).max(255)` sur les schemas Zod. Ajouter `.email()` sur les champs email du MCP.

---

### ELEVE 6. Client Supabase retourne un objet vide si env manquantes

**Statut:** NOUVEAU

Impact:
Si les variables d'environnement sont absentes, `createClient()` retourne `{} as SupabaseClient` au lieu de lever une erreur. Toute operation Supabase echouera avec des erreurs cryptiques du type "supabase.from is not a function".

Preuves:
- `src/lib/supabase/client.ts:12-13`: `return {} as SupabaseClient`
- `src/lib/supabase/admin.ts:5-6`: non-null assertions `!` sans validation

Recommandation:
Lever une erreur explicite (`throw new Error("Missing SUPABASE_URL")`) ou utiliser une librairie de validation d'env (zod, t3-env). Centraliser la validation dans un fichier `src/lib/env.ts`.

---

### ELEVE 7. Suppression de compte sans confirmation renforcee

**Statut:** NOUVEAU

Impact:
L'API de suppression de compte n'exige qu'une authentification par cookie. Aucune re-saisie de mot de passe ni confirmation par email n'est requise. Un vol de session permettrait la suppression immediate du compte.

Preuves:
- `src/app/api/account/delete/route.ts:7-14`: verifie seulement `getUser()` puis supprime via admin
- `src/app/dashboard/settings/page.tsx`: confirmation via AlertDialog cote client uniquement

Recommandation:
Exiger la re-saisie du mot de passe avant suppression. Envoyer une confirmation par email avec un delai de grace (24h).

---

## 6. Findings secondaires

### MOYEN 1. Settings page surdimensionnee (578 lignes)

**Statut:** NOUVEAU

Impact:
Le fichier `settings/page.tsx` contient 6 responsabilites differentes (profil, avatar, mot de passe, theme, export, suppression) dans un seul composant. Cela nuit a la lisibilite, la testabilite et la taille du bundle.

Preuves:
- `src/app/dashboard/settings/page.tsx`: 578 lignes, "use client"

Recommandation:
Extraire en sous-composants : `ProfileSection`, `PasswordSection`, `ThemeSection`, `DangerZoneSection`.

---

### MOYEN 2. Aucun fichier error.tsx (error boundaries)

**Statut:** NOUVEAU

Impact:
Une erreur runtime dans n'importe quelle page du dashboard crashe l'ensemble de la page sans fallback UI. L'utilisateur voit un ecran blanc.

Preuves:
- Aucun fichier `error.tsx` dans l'arborescence `src/app/`
- Seul `src/app/dashboard/loading.tsx` existe comme boundary

Recommandation:
Ajouter `error.tsx` dans `src/app/dashboard/`, `src/app/dashboard/projects/`, et `src/app/dashboard/settings/`.

---

### MOYEN 3. Code duplique : getInitials() dans 6 fichiers

**Statut:** NOUVEAU

Impact:
La fonction `getInitials()` est copiee-collee dans 6 composants differents avec la meme implementation. Toute correction doit etre appliquee 6 fois.

Preuves:
- `src/components/projects/kanban-board.tsx:95-102`
- `src/components/projects/project-detail-client.tsx:46-53`
- `src/components/projects/add-member-dialog.tsx:20-27`
- `src/components/projects/project-card.tsx:33-40`
- `src/components/projects/team-leaderboard.tsx` (meme pattern)
- `src/components/gamification/global-leaderboard.tsx:23-30`

Recommandation:
Extraire dans `src/lib/utils.ts` et importer partout.

---

### MOYEN 4. console.log de debug en production

**Statut:** NOUVEAU

Impact:
Des logs de debug avec tag `[create-project]` sont presents dans le code de production.

Preuves:
- `src/components/projects/create-project-dialog.tsx:46`: `console.log("[create-project] Inserting project...")`
- `src/components/projects/create-project-dialog.tsx:63`: `console.log("[create-project] Project created:", project.id)`
- `src/components/projects/create-project-dialog.tsx:77`: `console.log("[create-project] Owner member added")`

Recommandation:
Supprimer ces console.log ou les remplacer par un logger conditionnel (actif uniquement en dev).

---

### MOYEN 5. Headers de securite manquants

**Statut:** NOUVEAU

Impact:
Plusieurs headers de securite recommandes sont absents de la configuration Next.js.

Preuves:
- `next.config.mjs:7-24`: pas de `Strict-Transport-Security` (HSTS)
- Pas de `Permissions-Policy`
- Pas de `Cross-Origin-Opener-Policy`

Recommandation:
Ajouter dans la configuration headers :
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

### MOYEN 6. Kanban board sans memoisation

**Statut:** NOUVEAU

Impact:
L'objet `tasksByStatus` est recalcule a chaque render du composant kanban (489 lignes). Aucun `useMemo` n'est utilise dans le projet.

Preuves:
- `src/components/projects/kanban-board.tsx:298-313`: reconstruction de `tasksByStatus` a chaque render

Recommandation:
Envelopper dans `useMemo` avec `[tasks]` comme dependance.

---

### MOYEN 7. list_tools MCP incomplet

**Statut:** NOUVEAU

Impact:
L'outil `list_tools` du serveur MCP ne liste que 16 outils sur 17. `get_user_gamification` est absent.

Preuves:
- `mcp/tools/list-tools.ts`: 16 entrees, manque `get_user_gamification`
- `mcp/server.ts:206-214`: l'outil est pourtant enregistre

Recommandation:
Ajouter l'entree manquante dans list-tools.ts.

---

### FAIBLE 1. CLAUDE.md desynchronise avec l'etat reel

**Statut:** NOUVEAU

Impact:
La section "Problemes connus" de CLAUDE.md mentionne comme manquants des features qui sont implementees (upload avatar, changement de mot de passe, extension 3→5 statuts).

Preuves:
- `CLAUDE.md:103`: "Contrainte de statut tache : la BDD n'accepte que 3 statuts" — corrige par migration `20260402_extend_task_status.sql`
- `CLAUDE.md:106`: "Upload avatar : non implemente" — implemente dans `settings/page.tsx:111-158`
- `CLAUDE.md:107`: "Changement de mot de passe : absent" — implemente dans `settings/page.tsx:160-191`

Recommandation:
Mettre a jour la section "Problemes connus" de CLAUDE.md.

---

### FAIBLE 2. Export de donnees reference potentiellement d'anciennes tables

**Statut:** NOUVEAU

Impact:
L'endpoint d'export pourrait echouer silencieusement si des tables legacy (conversations, messages) ont ete supprimees.

Preuves:
- `src/app/api/account/export/route.ts`: exporte projects et tasks, mais la structure pourrait referencer d'anciennes tables

Recommandation:
Verifier et nettoyer les references aux tables supprimees dans l'export.

---

### FAIBLE 3. Pas de loading.tsx pour les sous-routes projects

**Statut:** NOUVEAU

Impact:
Le chargement des pages `/dashboard/projects` et `/dashboard/projects/[id]` n'a pas de skeleton de chargement dedie.

Preuves:
- Seul `src/app/dashboard/loading.tsx` existe
- Pas de `src/app/dashboard/projects/loading.tsx`
- Pas de `src/app/dashboard/leaderboard/loading.tsx`

Recommandation:
Ajouter des fichiers `loading.tsx` avec des skeletons adaptes a chaque sous-route.

---

### FAIBLE 4. Suppression de tache sans confirmation

**Statut:** NOUVEAU

Impact:
Contrairement a la suppression de projet (AlertDialog), la suppression de tache se fait en un clic sans confirmation.

Preuves:
- `src/components/projects/project-detail-client.tsx:147-159`: suppression directe sans dialog

Recommandation:
Ajouter un AlertDialog de confirmation ou un undo via toast.

---

## 7. Produit et UX

Ce que l'app fait bien:
- CRUD complet pour projets, taches, membres avec feedback utilisateur (toasts)
- Kanban drag & drop fluide avec 5 colonnes et reordonnancement persiste
- Gamification motivante : XP en temps reel, badges avec progression, leaderboard global et par equipe
- UI entierement en francais, coherente grace a shadcn/ui
- Empty states geres (projets vides, colonnes kanban, leaderboard)
- Responsive design avec sidebar mobile
- Pages legales completes et conformes RGPD

Ce qui manque pour passer un cap:
- Streaks et heatmap d'activite non fonctionnels (table `activity_log` absente)
- Pas de notifications email (invitation, deadline proche)
- Pas de recherche globale
- Pas de filtrage/tri avance des taches dans le kanban
- Pas de vue calendrier pour les deadlines
- Landing page fonctionnelle mais sans images/illustrations

---

## 8. Securite et conformite

Points positifs:
- RLS active sur toutes les tables avec helper functions
- Authentification Supabase avec cookies SSR
- Fichiers .env non versionnes (dans .gitignore)
- Pas de service role key expose cote client
- MCP authentifie par user (pas service role) — RLS appliquee
- X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy configurees
- frame-ancestors: none dans la CSP
- Pages legales RGPD completes
- Pas de `any` dans le code TypeScript applicatif

Points faibles:
- Middleware Next.js inexistant — sessions non rafraichies, routes non protegees cote serveur
- CSP avec `unsafe-inline` et `unsafe-eval` — protection XSS inefficace
- Pas de rate limiting sur les API routes
- Pas de re-authentification pour la suppression de compte
- Pas de validation de longueur maximale sur les inputs
- Pas de HSTS ni Permissions-Policy
- Functions `SECURITY DEFINER` dans les migrations (`batch_update_task_positions`, `sync_user_badges`) — bypasse RLS
- Pas de validation `.email()` sur les champs email du MCP

---

## 9. Performance et architecture

Points positifs:
- Server Components pour le data fetching (dashboard, projects list, project detail)
- Client Components reserves aux interactions (formulaires, drag-drop, realtime)
- Supabase realtime subscriptions avec cleanup dans useEffect
- Singleton pattern sur le browser client Supabase
- Pas de dependances lourdes (moment.js, lodash)
- Leaderboard limite a 50 resultats
- Queries parallelisees avec `Promise.all` dans les lib functions

Points d'attention:
- Aucun `useMemo` dans le projet — `tasksByStatus` recalcule a chaque render dans le kanban
- Pas de `dynamic()` imports pour les dialogs lourds
- Pas d'optimisation d'images (next/image non utilise)
- Pas de loading.tsx pour les sous-routes projects et leaderboard
- 5 composants de plus de 200 lignes dont un a 578
- `dangerouslySetInnerHTML` dans le layout racine pour le theme (acceptable mais a surveiller)

---

## 10. Maintenabilite

Niveau actuel: Faible

Freins principaux:
- **Zero tests** : pas de framework de test installe (jest, vitest), aucun fichier de test
- **Zero CI/CD** : pas de GitHub Actions, pas de vercel.json, pas de pre-commit hooks
- **Code duplique** : `getInitials()` copie dans 6 fichiers, `formatDate` duplique
- **Composants surdimensionnes** : settings (578), kanban (489), project-detail (395)
- **Pas de logging structure** : seuls des console.log/console.error
- **Pas d'observabilite** : pas de monitoring, pas d'alertes, pas de metriques
- **Documentation desynchronisee** : CLAUDE.md liste des problemes deja corriges, README incomplet sur les tools MCP

---

## 11. Bilan des corrections v0 -> v1

Ceci est le premier audit. Pas de comparaison possible.

---

## 12. Plan d'action recommande

### Priorite immediate

1. Creer le fichier `src/middleware.ts` exportant le proxy et le config depuis `src/lib/proxy.ts`
2. Creer la migration `activity_log` + fonction `get_user_streak` + trigger sur task completion
3. Renforcer la CSP : supprimer `unsafe-inline`/`unsafe-eval`, utiliser les nonces Next.js
4. Ajouter la validation de longueur (.min/.max) sur tous les inputs et schemas Zod
5. Corriger `createClient()` pour lever une erreur au lieu de retourner `{} as SupabaseClient`

### Priorite court terme

6. Ajouter `error.tsx` dans dashboard/, dashboard/projects/, dashboard/settings/
7. Extraire `getInitials()` et `formatDate()` dans `src/lib/utils.ts`
8. Decomposer `settings/page.tsx` en sous-composants
9. Ajouter rate limiting sur les API routes (delete, export)
10. Ajouter HSTS et Permissions-Policy dans les headers
11. Supprimer les console.log de debug
12. Exiger la re-saisie du mot de passe pour la suppression de compte
13. Ajouter `.email()` sur les schemas Zod du MCP (invite-member, get-user-by-email)
14. Completer `list_tools` MCP avec `get_user_gamification`

### Priorite moyen terme

15. Installer un framework de test (Vitest) et ecrire les tests critiques (auth, gamification, API routes)
16. Mettre en place une CI/CD GitHub Actions (lint, typecheck, build, tests)
17. Ajouter `useMemo` pour les calculs derives dans le kanban
18. Ajouter des loading.tsx pour projects et leaderboard
19. Mettre a jour CLAUDE.md et README.md pour refleter l'etat reel du projet
20. Auditer les functions SECURITY DEFINER (batch_update_task_positions, sync_user_badges) et ajouter des checks d'autorisation internes

---

## 13. Conclusion

TaskFlow est un projet impressionnant pour un Challenge 48h : une application complete avec authentification, CRUD projet/taches, kanban drag & drop, gamification XP/badges/leaderboard, et un serveur MCP fonctionnel avec 17 outils. L'architecture est saine et les choix techniques (App Router, RLS, realtime) sont pertinents.

Cependant, le projet souffre de lacunes de securite critiques (middleware absent, CSP faible) et d'un manque total d'infrastructure qualite (tests, CI/CD, logging). Le correctif le plus urgent et le plus simple est la creation du fichier middleware — sans lui, la protection des routes et le rafraichissement des sessions sont inoperants. Le passage de 4.5/10 a 7/10 est accessible rapidement en corrigeant les 5 items de priorite immediate.
