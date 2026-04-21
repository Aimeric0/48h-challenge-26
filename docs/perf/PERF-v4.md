# Audit Performance -- v4

Date: 2026-04-03
Version precedente: v3

## 1. Synthese

- `getUser()` est toujours utilise 15 fois dans le projet, 0 `getSession()` -- aucun progres depuis v3 (12 appels a l'epoque, 3 nouveaux)
- Le middleware fait toujours un round-trip reseau `getUser()` sur chaque requete HTTP
- Le dashboard layout reste un Client Component avec `getUser()` dans un useEffect -- waterfall systematique inchange
- Le profil est toujours fetche en double (layout client + page serveur) a chaque visite du dashboard
- La page dashboard fait une sous-requete sequentielle pour compter les invitations (waterfall dans le `Promise.all`)
- La page leaderboard est le seul endroit avec `.limit()` -- toutes les autres requetes restent sans borne
- Aucun `React.memo`, `Suspense`, `next/dynamic` ou `next/image` dans tout le projet (inchange depuis v3)

Score performance estime: **4.5/10**
Evolution: legere regression par rapport a v3 (5/10) -- 3 nouveaux appels `getUser()` (leaderboard, kanban, task-status-select), waterfall detecte dans dashboard page, console.log en augmentation

---

## 2. Chemin critique d'une navigation

Navigation typique : ouverture de `/dashboard`

| Etape | Action | Duree estimee |
|-------|--------|---------------|
| 1 | Middleware: `getUser()` (round-trip reseau Supabase) | 100-300ms |
| 2 | Hydration JavaScript (layout = Client Component) | 50-100ms |
| 3 | Layout useEffect: `getUser()` + `profiles.select(full_name, xp, level, avatar_url)` | 200-400ms |
| 4 | Page server: `getUser()` + `profiles.select(full_name, xp, level)` | 100-300ms |
| 5 | Page server Promise.all: 6 requetes paralleles dont 1 avec sous-requete sequentielle | 200-500ms |
| 6 | Page server: `activity_log.select()` (hors Promise.all) | 50-150ms |
| **Total** | | **700ms - 1.75s** |

Note: les etapes 3 et 4-6 sont partiellement paralleles (client vs serveur), mais le layout client bloque le shell visuel. Le fetch `activity_log` est sequentiel apres le `Promise.all` de la page.

---

## 3. Findings

### CRITIQUE -- Middleware utilise getUser() au lieu de getSession()

**Fichier:** `src/lib/supabase/middleware.ts:30`
**Statut:** PERSISTENT depuis v1

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

`getUser()` fait un appel reseau vers Supabase Auth a CHAQUE requete HTTP. Le middleware s'execute sur toutes les routes matchees. `getSession()` lit le JWT depuis le cookie sans round-trip.

**Impact:** +100-300ms sur CHAQUE navigation (page, API route, etc.). C'est le bottleneck le plus critique du projet.

**Correction:** Remplacer par `const { data: { session } } = await supabase.auth.getSession()` et utiliser `session?.user` pour les redirections. Garder `getUser()` uniquement dans les API routes sensibles (delete, export).

---

### ELEVE -- Dashboard layout en Client Component avec getUser() dans useEffect

**Fichier:** `src/app/dashboard/layout.tsx:1,51`
**Statut:** PERSISTENT depuis v1

Le layout est marque `"use client"` et fait `getUser()` + `profiles.select(full_name, xp, level, avatar_url)` dans un useEffect (lignes 45-121). Cela force :
1. Le telechargement et l'hydration du JS du layout avant tout rendu
2. Un appel reseau `getUser()` (waterfall apres hydration)
3. Un fetch profil sequentiel apres getUser

**Impact:** Pas de SSR pour le shell (sidebar, header). Waterfall de ~300-500ms apres hydration. Le profil est aussi fetche par `/dashboard/page.tsx` server-side, creant une duplication.

**Correction:** Convertir en Server Component. Fetcher le profil cote serveur. Isoler les subscriptions Realtime (XP, badges) dans un petit Client Component `<RealtimeProvider>` ou `<RealtimeListeners>`.

---

### ELEVE -- getUser() utilise 15 fois, getSession() jamais

**Fichiers (15 appels) :**
- `src/lib/supabase/middleware.ts:30`
- `src/app/page.tsx:63`
- `src/app/dashboard/page.tsx:12`
- `src/app/dashboard/layout.tsx:51`
- `src/app/dashboard/leaderboard/page.tsx:8` (NOUVEAU)
- `src/app/dashboard/projects/[id]/page.tsx:15`
- `src/app/dashboard/settings/page.tsx:58`
- `src/app/dashboard/settings/page.tsx:95` (doublon dans le meme fichier)
- `src/lib/supabase/projects.ts:8`
- `src/lib/supabase/projects.ts:74`
- `src/components/projects/create-project-dialog.tsx:40`
- `src/components/projects/kanban-board.tsx:420` (NOUVEAU)
- `src/components/projects/task-status-select.tsx:48` (NOUVEAU)
- `src/app/api/account/delete/route.ts:7`
- `src/app/api/account/export/route.ts:6`

**Statut:** PERSISTENT depuis v1 -- aggrave (12 → 15 appels)

Chaque `getUser()` fait un round-trip reseau. Pour les Server Components et le middleware, `getSession()` suffit.

**Impact:** 15 round-trips evitables. Sur une navigation `/dashboard/projects/[id]` : middleware + layout + page + getProjectById = 5 appels getUser() = 500ms-1.5s de latence pure en auth.

**Correction:**
- Middleware, pages server, projects.ts : utiliser `getSession()`
- API routes sensibles (delete, export) : garder `getUser()`
- Client Components (kanban, task-status) : passer le userId en prop depuis le parent au lieu de re-fetcher

---

### ELEVE -- Waterfall dans la page dashboard (sous-requete dans Promise.all)

**Fichier:** `src/app/dashboard/page.tsx:56-62`
**Statut:** NOUVEAU

```typescript
const [/* ... */, invitedRes] = await Promise.all([
  // ...
  supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("role", "member")
    .in("project_id",
      (await supabase.from("projects").select("id").eq("owner_id", userId!))
        .data?.map((p) => p.id) || []
    ),
  // ...
]);
```

Le 4eme element du `Promise.all` contient un `await` imbrique : il attend la liste des projets du user AVANT de lancer la requete membres. Cela cree un waterfall de 2 requetes la ou les autres branches du `Promise.all` se resolvent en une seule.

**Impact:** +100-200ms de latence supplementaire sur la page dashboard. La sous-requete projets bloque toutes les branches suivantes du `Promise.all` qui n'ont pas encore demarre.

**Correction:** Sortir la requete projets du Promise.all. Fetcher les project IDs en amont, puis passer l'array au Promise.all.

---

### MOYEN -- Fetch activity_log sequentiel apres le Promise.all

**Fichier:** `src/app/dashboard/page.tsx:82-90`
**Statut:** NOUVEAU

```typescript
// Apres le Promise.all (ligne 32-69)
const { data } = await supabase
  .from("activity_log")
  .select("activity_date")
  .eq("user_id", userId)
  .gte("activity_date", sixteenWeeksAgo.toISOString().split("T")[0]);
```

Ce fetch est execute sequentiellement apres le `Promise.all` de la ligne 32. Il pourrait etre inclus dans le `Promise.all` pour s'executer en parallele avec les autres requetes.

**Impact:** +50-150ms de latence ajoutee inutilement.

**Correction:** Deplacer cette requete dans le `Promise.all` existant.

---

### MOYEN -- select("*") sans colonnes specifiques (9 occurrences)

**Fichiers:**
- `src/lib/supabase/projects.ts:13,79,92,108` (4 occurrences)
- `src/components/projects/create-task-dialog.tsx:81`
- `src/components/projects/add-member-dialog.tsx:67`
- `src/app/api/account/export/route.ts:15,28,35` (3 occurrences)

**Statut:** PERSISTENT depuis v1

9 occurrences de `.select("*")`. Les tables projets et taches pourraient contenir des colonnes lourdes (descriptions longues). Seules les colonnes necessaires devraient etre fetchees.

**Impact:** Transfert de donnees inutiles. Faible impact aujourd'hui mais degrade avec le volume.

**Correction:** Remplacer par des selections explicites :
- `projects.select("id, name, description, status, deadline, owner_id, created_at")`
- `tasks.select("id, title, status, deadline, assignee_id, position, project_id")`
- `profiles.select("id, full_name, email, avatar_url, xp, level")`

---

### MOYEN -- Aucune pagination sur les requetes projets et taches

**Fichiers:**
- `src/lib/supabase/projects.ts:11-14` (getProjectsWithStats -- tous les projets)
- `src/lib/supabase/projects.ts:85-95` (getProjectById -- toutes les taches d'un projet)
- `src/app/api/account/export/route.ts:24-38` (export -- tous les projets et taches)

**Statut:** PERSISTENT depuis v1

Seul `src/app/dashboard/leaderboard/page.tsx:14` utilise `.limit(50)`. Aucune autre requete n'est bornee.

**Impact:** Negligeable avec 5-10 projets. Degrade significativement avec 50+ projets ou 100+ taches par projet.

**Correction:** Ajouter `.limit(50)` sur getProjectsWithStats. `.limit(200)` comme garde-fou sur les taches par projet.

---

### MOYEN -- Profil fetche en double (layout + page)

**Fichiers:**
- `src/app/dashboard/layout.tsx:51-60` -- `getUser()` + `profiles.select(full_name, xp, level, avatar_url)` (client)
- `src/app/dashboard/page.tsx:12-19` -- `getUser()` + `profiles.select(full_name, xp, level)` (serveur)

**Statut:** PERSISTENT depuis v1

Le layout (client) et la page dashboard (serveur) fetchent chacun le profil independamment.

**Impact:** 2 requetes getUser + 2 requetes profiles a chaque visite du dashboard. ~200-400ms gaspilles.

**Correction:** Convertir le layout en Server Component et centraliser le fetch profil. Passer les donnees aux composants enfants.

---

### MOYEN -- getUser() duplique dans settings (2 appels meme fichier)

**Fichier:** `src/app/dashboard/settings/page.tsx:58,95`
**Statut:** NOUVEAU (non detecte en v3)

Ligne 58 : `getUser()` dans le `useEffect` initial pour charger le profil.
Ligne 95 : `getUser()` dans `handleUpdateProfile` pour verifier si l'email a change.

Le userId est deja disponible dans le state (`userId` set a la ligne 60). Le second appel est evitable.

**Impact:** +100-300ms par mise a jour de profil.

**Correction:** Utiliser `userId` du state et comparer directement avec `email` du state au lieu de re-fetcher l'user.

---

### MOYEN -- Nouveau client Supabase cree a chaque drag/status change

**Fichiers:**
- `src/components/projects/kanban-board.tsx:414,440`
- `src/components/projects/task-status-select.tsx:43`

**Statut:** PERSISTENT depuis v3

`createClient()` est appele dans `persistStatus` et `persistPositions` -- fonctions appelees a chaque fin de drag. Meme pattern dans `task-status-select.tsx` a chaque changement de statut.

**Impact:** Faible grace au singleton browser. Mais le pattern est fragile et les appels `getUser()` dans ces fonctions (kanban:420, task-status:48) sont des round-trips reels.

**Correction:** Deplacer `createClient()` au niveau du composant. Passer le userId en prop depuis le parent server component pour eviter `getUser()`.

---

### FAIBLE -- Pas de Suspense boundaries

**Fichier:** `src/app/dashboard/` (toutes les pages)
**Statut:** PERSISTENT depuis v1

Un seul `loading.tsx` existe pour tout le dashboard. Aucune boundary `<Suspense>` ne decoupe le contenu. La page dashboard fait 8+ requetes dans un seul bloc sequentiel.

**Impact:** Leger. Le loading.tsx couvre les transitions.

**Correction:** Ajouter `<Suspense fallback={<Skeleton />}>` autour des sections couteuses (BadgesGrid, ActivityHeatmap, stats cards).

---

### FAIBLE -- Export de donnees non streame avec O(n*m) groupement

**Fichier:** `src/app/api/account/export/route.ts:44-49`
**Statut:** PERSISTENT depuis v1 -- detail aggrave

```typescript
projects: (projects || []).map((project) => ({
  ...project,
  tasks: (tasks || []).filter((t) => t.project_id === project.id),
})),
```

Pour chaque projet, un `.filter()` parcourt TOUTES les taches. Avec 100 projets et 10 000 taches : 1 000 000 comparaisons. De plus, tout est serialise en memoire avant envoi.

**Impact:** Negligeable en usage normal. Risque de timeout avec un gros volume.

**Correction:** Grouper les taches par `project_id` dans une Map avant le mapping, et/ou streamer la reponse.

---

### FAIBLE -- console.log et console.error en production (18 occurrences)

**Fichiers:**
- `src/components/projects/create-project-dialog.tsx:42,46,60,63,74,77,115` (7 occurrences)
- `src/components/projects/create-task-dialog.tsx:96`
- `src/components/projects/project-detail-client.tsx:115,142,154`
- `src/components/projects/project-status-select.tsx:49`
- `src/components/projects/kanban-board.tsx:431,449`
- `src/components/projects/task-status-select.tsx:63`
- `src/app/api/account/delete/route.ts:17,23`
- `src/app/api/account/export/route.ts:59`

**Statut:** PERSISTENT depuis v3 -- aggrave (3 → 18 occurrences)

**Impact:** Pollution de la console en production. Les `console.error` pour les erreurs sont acceptables cote serveur, mais les `console.log` cote client sont du bruit.

**Correction:** Supprimer les `console.log` (lignes 46, 63, 77 de create-project-dialog). Garder les `console.error` dans les API routes.

---

### FAIBLE -- Aucun next/image dans le projet

**Fichier:** Aucun (sauf `src/lib/proxy.ts` non utilise)
**Statut:** PERSISTENT depuis v1

Aucune image n'utilise `next/image`. Les avatars passent par `<AvatarImage>` de Radix UI qui genere un `<img>` standard.

**Impact:** Faible. Les avatars sont petits et peu nombreux. Pas de grandes images a optimiser.

**Correction:** Non prioritaire. A considerer si des images plus lourdes sont ajoutees.

---

## 4. Points positifs

- Client Supabase browser singleton au niveau module -- pas de recreations couteuses
- `getProjectsWithStats` utilise `Promise.all` pour fetch membres + taches en parallele
- `getProjectById` utilise aussi `Promise.all` pour membres + taches
- Dashboard page est un Server Component avec fetch serveur et `Promise.all`
- Leaderboard utilise `.limit(50)` et selectionne des colonnes specifiques -- seul endroit correct
- `useMemo` dans le kanban board pour grouper les taches par statut
- `useCallback` dans le layout pour `handleXpUpdate`
- dnd-kit bien integre avec optimistic updates
- Pages serveur (dashboard, projects, leaderboard, project detail) : bonne separation SC/CC
- `loading.tsx` dans le dashboard offre un feedback visuel
- `next/link` utilise partout -- navigation client-side
- Theming (dark/light) via next-themes sans flash
- Cookie consent RGPD present
- Realtime subscriptions avec cleanup correct dans le layout
- Supabase client correctement memoize dans settings avec `useState(() => createClient())`
- Dependencies propres : react-markdown et react-syntax-highlighter ne sont plus dans package.json (corrige depuis v3)

---

## 5. Plan de correction

### Quick wins (impact immediat, peu d'effort)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 1 | Remplacer `getUser()` par `getSession()` dans le middleware | `src/lib/supabase/middleware.ts` | -100-300ms sur CHAQUE navigation |
| 2 | Remplacer `getUser()` par `getSession()` dans la page d'accueil | `src/app/page.tsx` | -100-300ms sur premiere visite |
| 3 | Remplacer `getUser()` par `getSession()` dans projects.ts | `src/lib/supabase/projects.ts` (x2) | -200-600ms sur pages projets |
| 4 | Remplacer `getUser()` par `getSession()` dans leaderboard | `src/app/dashboard/leaderboard/page.tsx` | -100-300ms |
| 5 | Supprimer le `getUser()` duplique dans settings (l.95) | `src/app/dashboard/settings/page.tsx` | -100-300ms par update profil |
| 6 | Deplacer le fetch `activity_log` dans le `Promise.all` | `src/app/dashboard/page.tsx` | -50-150ms sur /dashboard |
| 7 | Sortir la sous-requete projets du `Promise.all` (invitedRes) | `src/app/dashboard/page.tsx` | -100-200ms sur /dashboard |
| 8 | Ajouter `.limit(50)` sur getProjectsWithStats | `src/lib/supabase/projects.ts` | Protection contre le volume |
| 9 | Supprimer les 3 console.log dans create-project-dialog | `src/components/projects/create-project-dialog.tsx` | Proprete |
| 10 | Specifier les colonnes au lieu de `select("*")` | Multiples fichiers (9 occurrences) | Moins de transfert |

### Corrections structurelles (plus d'effort, gros impact)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 11 | Convertir le layout dashboard en Server Component | `src/app/dashboard/layout.tsx` | SSR du shell, elimination waterfall, -300-500ms |
| 12 | Extraire les subscriptions Realtime dans un `<RealtimeListeners>` CC | Nouveau composant | Permet la conversion du layout en SC |
| 13 | Centraliser le fetch profil dans le layout (apres conversion SC) | Layout + pages | Elimination de 2-3 requetes dupliquees |
| 14 | Passer userId en prop aux CC (kanban, task-status-select) | `kanban-board.tsx`, `task-status-select.tsx` | Elimination de getUser() cote client |

### Ameliorations futures

| # | Action | Impact |
|---|--------|--------|
| 15 | Ajouter `<Suspense>` boundaries dans les pages | Rendu progressif |
| 16 | Ajouter `.limit(200)` sur les taches par projet | Garde-fou scalabilite |
| 17 | Lazy load du kanban avec `next/dynamic` | Reduction du bundle initial des pages projet |
| 18 | `React.memo` sur KanbanColumn | Moins de re-renders pendant le drag |
| 19 | Grouper les taches par project_id dans une Map pour l'export | O(n+m) au lieu de O(n*m) |

---

## 6. Requetes reseau par page

### / (page d'accueil)
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Page server component | reseau |
| **Total: 2 requetes reseau** | | |

### /dashboard (accueil)
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level, avatar_url) | Layout useEffect (client) | reseau |
| auth.getUser() | Page server component | reseau |
| profiles.select(full_name, xp, level) | Page server component | reseau |
| tasks.select(count).eq(done) | Page server component | reseau |
| projects.select(count).eq(completed) | Page server component | reseau |
| projects.select(count).eq(owner_id) | Page server component | reseau |
| **projects.select(id).eq(owner_id)** | **Page server (sous-requete dans Promise.all)** | **reseau** |
| project_members.select(count).eq(member) | Page server component | reseau |
| tasks.select(count).eq(assignee_id) | Page server component | reseau |
| rpc(get_user_streak) | Page server component | reseau |
| rpc(sync_user_badges) | Page server component | reseau |
| activity_log.select(activity_date) | Page server component (sequentiel) | reseau |
| **Total: 14 requetes** (dont getUser x3, profiles x2) | | |

### /dashboard/leaderboard
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level, avatar_url) | Layout useEffect (client) | reseau |
| auth.getUser() | Page server component | reseau |
| profiles.select(...).limit(50) | Page server component | reseau |
| **Total: 5 requetes** (dont getUser x3) | | |

### /dashboard/projects
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level, avatar_url) | Layout useEffect (client) | reseau |
| auth.getUser() | getProjectsWithStats (server) | reseau |
| projects.select(*) | getProjectsWithStats | reseau |
| project_members.select(...) | getProjectsWithStats | reseau |
| tasks.select(project_id,status,deadline) | getProjectsWithStats | reseau |
| profiles.select(...) | getProjectsWithStats | reseau |
| **Total: 8 requetes** (dont getUser x3) | | |

### /dashboard/projects/[id]
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level, avatar_url) | Layout useEffect (client) | reseau |
| auth.getUser() | Page server component | reseau |
| auth.getUser() | getProjectById (server) | reseau |
| projects.select(*).eq(id) | getProjectById | reseau |
| project_members.select(...) | getProjectById | reseau |
| tasks.select(*) | getProjectById | reseau |
| profiles.select(*) | getProjectById | reseau |
| **Total: 9 requetes** (dont getUser x4) | | |

### /dashboard/settings
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level, avatar_url) | Layout useEffect (client) | reseau |
| auth.getUser() | Settings useEffect (client) | reseau |
| profiles.select(full_name, avatar_url) | Settings useEffect (client) | reseau |
| **Total: 5 requetes** (dont getUser x3, profiles x2) | | |

---

## 7. Comparaison v3 -> v4

| Probleme v3 | Statut v4 |
|-------------|-----------|
| CRITIQUE -- Middleware utilise getUser() | PERSISTENT -- toujours getUser() (ligne 30) |
| ELEVE -- Dashboard layout Client Component | PERSISTENT -- toujours "use client" avec useEffect |
| ELEVE -- getUser() x12, getSession() x0 | AGGRAVE -- getUser() x15, getSession() x0 (3 nouveaux: leaderboard, kanban, task-status) |
| MOYEN -- select("*") x9 | PERSISTENT -- toujours 9 occurrences |
| MOYEN -- Aucune pagination | PERSISTENT -- seul leaderboard a un .limit(50) |
| MOYEN -- Profil fetche en double | PERSISTENT -- layout (client) + page (server) |
| MOYEN -- Client Supabase cree dans closures kanban | PERSISTENT -- kanban:414,440 + task-status:43 |
| FAIBLE -- Pas de Suspense | PERSISTENT |
| FAIBLE -- Export non streame | PERSISTENT |
| FAIBLE -- console.log en production (3) | AGGRAVE -- 18 occurrences (console.log + console.error) |
| -- | NOUVEAU ELEVE -- Waterfall sous-requete dans Promise.all (dashboard:56-62) |
| -- | NOUVEAU MOYEN -- activity_log fetch sequentiel hors Promise.all (dashboard:82-90) |
| -- | NOUVEAU MOYEN -- getUser() duplique dans settings (lignes 58 et 95) |

---

## 8. Objectif v5

Passer de 4.5/10 a 7/10 en appliquant les quick wins et au moins une correction structurelle :
- 0 appel `getUser()` dans le middleware (passer a `getSession()`)
- `getSession()` par defaut partout sauf API routes sensibles (objectif : 2 getUser max au lieu de 15)
- Layout dashboard converti en Server Component avec Realtime isole
- Waterfall dashboard corrige (sous-requete sortie + activity_log dans Promise.all)
- `.limit()` sur toutes les requetes sans borne
- Colonnes explicites dans les `select()` critiques
- 0 console.log cote client en production
