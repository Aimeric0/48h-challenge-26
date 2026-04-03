# Audit Performance -- v3

Date: 2026-03-31
Version precedente: v2

## 1. Synthese

- Le chat, les prompts et les composants markdown/syntax-highlighter ont ete supprimes -- eliminant le plus gros probleme de bundle de v2 (~420KB)
- Le middleware utilise toujours `getUser()` au lieu de `getSession()` -- regression par rapport a ce que v2 affirmait corrige
- Le dashboard layout reste un Client Component avec `getUser()` dans un useEffect -- waterfall systematique
- `getUser()` est utilise 12 fois dans le projet, jamais `getSession()` -- chaque appel fait un round-trip reseau vers Supabase
- Aucune pagination (`limit`/`range`) sur aucune requete projet/tache
- Aucun `React.memo`, `Suspense`, `next/dynamic` ou `next/image` dans tout le projet

Score performance estime: **5/10**
Evolution: stable par rapport a v2 (5/10) -- le retrait du chat elimine des problemes mais le middleware et le layout n'ont pas progresse

---

## 2. Chemin critique d'une navigation

Navigation typique : ouverture de `/dashboard/projects`

| Etape | Action | Duree estimee |
|-------|--------|---------------|
| 1 | Middleware: `getUser()` (round-trip reseau Supabase) | 100-300ms |
| 2 | Hydration JavaScript (layout = Client Component) | 50-100ms |
| 3 | Layout useEffect: `getUser()` + `profiles.select()` | 200-400ms |
| 4 | Projects page (Server Component): `getUser()` + `projects.select(*)` + `members.select` + `tasks.select` + `profiles.select` | 200-400ms |
| **Total** | | **550ms - 1.2s** |

Note: les etapes 3 et 4 sont sequentielles car le layout client bloque le rendering. La page server fait ses fetches en parallele (Promise.all) mais doit attendre l'hydration du layout.

---

## 3. Findings

### CRITIQUE -- Middleware utilise getUser() au lieu de getSession()

**Fichier:** `src/lib/supabase/middleware.ts:30`
**Statut:** PERSISTENT depuis v1 (v2 affirmait une correction qui n'est pas en place)

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

`getUser()` fait un appel reseau vers Supabase Auth a CHAQUE requete HTTP. Le middleware s'execute sur toutes les routes matchees. `getSession()` lit le JWT depuis le cookie sans round-trip.

**Impact:** +100-300ms sur CHAQUE navigation (page, API route, etc.). C'est le bottleneck le plus critique du projet.

**Correction:** Remplacer par `const { data: { session } } = await supabase.auth.getSession()` et utiliser `session?.user` pour les redirections. Garder `getUser()` uniquement dans les API routes sensibles (delete account, export) ou on a besoin d'une validation server-side.

---

### ELEVE -- Dashboard layout en Client Component avec getUser() dans useEffect

**Fichier:** `src/app/dashboard/layout.tsx:1,24`
**Statut:** PERSISTENT depuis v1

Le layout est marque `"use client"` et fait `getUser()` + `profiles.select()` dans un useEffect (lignes 20-38). Cela force:
1. Le telechargement et l'hydration du JS du layout avant tout rendu
2. Un appel reseau `getUser()` (waterfall apres hydration)
3. Un fetch profil sequentiel apres getUser

**Impact:** Pas de SSR pour le shell (sidebar, header). Waterfall de ~300-500ms apres hydration. Le profil est aussi fetche par `/dashboard/page.tsx` server-side, creant une duplication.

**Correction:** Convertir en Server Component. Fetcher le profil cote serveur. Isoler `sidebarCollapsed` et `mobileOpen` dans de petits Client Components (SidebarWrapper, MobileMenuButton).

---

### ELEVE -- getUser() utilise partout au lieu de getSession()

**Fichiers:**
- `src/app/page.tsx:8`
- `src/app/dashboard/page.tsx:11`
- `src/app/dashboard/layout.tsx:24`
- `src/lib/supabase/projects.ts:8,74`
- `src/app/dashboard/projects/[id]/page.tsx:15`
- `src/app/dashboard/settings/page.tsx:50,86`
- `src/components/projects/create-project-dialog.tsx:40`
- `src/app/api/account/delete/route.ts:7`
- `src/app/api/account/export/route.ts:6`

**Statut:** PERSISTENT depuis v1

12 appels `getUser()`, 0 appels `getSession()`. Chaque `getUser()` fait un round-trip reseau. Pour les Server Components et les Client Components qui veulent juste le user ID, `getSession()` suffit.

**Impact:** 12 round-trips evitables. Sur une navigation typique (middleware + layout + page + projects.ts), c'est 4-5 appels getUser() = 400ms-1.5s de latence pure.

**Correction:**
- Middleware, page.tsx (redirect), layout, Server Components: utiliser `getSession()`
- API routes sensibles (delete, export): garder `getUser()` pour la securite
- Client Components: utiliser `getSession()` sauf si une verification serveur est requise

---

### MOYEN -- select("*") sans colonnes specifiques

**Fichiers:**
- `src/lib/supabase/projects.ts:13,79,92,108` (4 occurrences)
- `src/components/projects/add-member-dialog.tsx:67`
- `src/components/projects/create-task-dialog.tsx:81`
- `src/app/api/account/export/route.ts:15,18,28`

**Statut:** PERSISTENT depuis v1

9 occurrences de `.select("*")`. Les tables projets et taches pourraient contenir des colonnes lourdes (descriptions longues). Seules les colonnes necessaires devraient etre fetchees.

**Impact:** Transfert de donnees inutiles. Faible impact aujourd'hui, mais degrade avec le volume et les colonnes ajoutees.

**Correction:** Remplacer par des selections explicites. Exemples:
- `projects.select("id, name, description, status, deadline, owner_id, created_at")` au lieu de `select("*")`
- `tasks.select("id, title, status, deadline, assignee_id, position, project_id")` pour la liste

---

### MOYEN -- Aucune pagination sur les requetes projets et taches

**Fichiers:**
- `src/lib/supabase/projects.ts:11-14` (getProjectsWithStats -- tous les projets)
- `src/lib/supabase/projects.ts:85-95` (getProjectById -- toutes les taches d'un projet)

**Statut:** PERSISTENT depuis v1

Aucun `.limit()` ni `.range()` dans tout le projet. `getProjectsWithStats` charge TOUS les projets de l'utilisateur, puis fetch TOUS les membres et taches associes en bulk. `getProjectById` charge TOUTES les taches.

**Impact:** Negligeable avec 5-10 projets et 20-30 taches. Degrade significativement avec 50+ projets ou 100+ taches par projet.

**Correction:** Ajouter `.limit(50)` sur les requetes projets. Pour les taches d'un projet, la charge complete est acceptable (kanban a besoin de toutes les taches), mais ajouter `.limit(200)` comme garde-fou.

---

### MOYEN -- Profil fetche en double (layout + page)

**Fichiers:**
- `src/app/dashboard/layout.tsx:22-29` -- `getUser()` + `profiles.select(full_name, xp, level)` (client)
- `src/app/dashboard/page.tsx:11-18` -- `getUser()` + `profiles.select(full_name, xp, level)` (serveur)

**Statut:** PERSISTENT depuis v1

Le layout (client) et la page dashboard (serveur) fetchent chacun le profil independamment. Le layout le fait pour le header (userName, xp, level). La page le fait pour l'affichage.

**Impact:** 2 requetes getUser + 2 requetes profiles a chaque visite du dashboard. ~200-400ms gaspilles.

**Correction:** Convertir le layout en Server Component et centraliser le fetch profil. Passer les donnees via props ou un contexte React.

---

### MOYEN -- Nouveau client Supabase cree a chaque drag dans le kanban

**Fichier:** `src/components/projects/kanban-board.tsx:395,410`
**Statut:** NOUVEAU

```typescript
async function persistStatus(taskId: string, newStatus: TaskStatus) {
    const supabase = createClient(); // appele a chaque drag
```

`createClient()` est appele dans `persistStatus` et `persistPositions` -- fonctions appelees a chaque fin de drag. Bien que le client soit un singleton au niveau module, l'appel dans une closure async ajoute de l'indirection.

**Impact:** Faible grace au singleton. Mais le pattern est fragile : si le singleton est retire, chaque drag creerait un nouveau client.

**Correction:** Deplacer `const supabase = createClient()` au niveau du composant `KanbanBoard`, avant le return.

---

### FAIBLE -- Pas de Suspense boundaries

**Fichier:** `src/app/dashboard/` (toutes les pages)
**Statut:** PERSISTENT depuis v1

Un seul `loading.tsx` existe pour tout le dashboard. Aucune boundary `<Suspense>` ne decoupe le contenu. La page dashboard attend que les 3 requetes terminent (`getUser`, `profiles`, `tasks count`, `projects count`) avant d'afficher.

**Impact:** Leger. Le loading.tsx couvre les transitions.

**Correction:** Ajouter `<Suspense fallback={<Skeleton />}>` autour des sections de stats.

---

### FAIBLE -- Export de donnees non streame

**Fichier:** `src/app/api/account/export/route.ts:14-43`
**Statut:** PERSISTENT depuis v1

Charge toutes les conversations et messages en memoire avant de serialiser en JSON.

**Impact:** Negligeable en usage normal. Risque de timeout avec des centaines de conversations (si la feature chat revient).

---

### FAIBLE -- console.log restants dans create-project-dialog

**Fichier:** `src/components/projects/create-project-dialog.tsx:46,63,77`
**Statut:** NOUVEAU

Trois `console.log("[create-project]...")` laisses dans le code de production.

**Impact:** Pollution de la console en production. Negligeable.

**Correction:** Supprimer les console.log ou les remplacer par un logger conditionnel.

---

## 4. Points positifs

- Suppression du chat/prompts/markdown/syntax-highlighter -- elimination de ~420KB de JS lourd (corrige depuis v2)
- Client Supabase browser singleton au niveau module -- pas de recreations inutiles
- `getProjectsWithStats` utilise `Promise.all` pour fetch membres + taches en parallele
- `getProjectById` utilise aussi `Promise.all` pour membres + taches
- Dashboard page est un Server Component avec fetch serveur
- Projects page est un Server Component qui passe les donnees au client
- `loading.tsx` dans le dashboard offre un feedback visuel
- `useMemo` dans le kanban board pour grouper les taches par statut
- dnd-kit bien integre avec optimistic updates
- Arborescence propre : separation claire Server/Client Components pour les pages projets
- `next/link` utilise partout -- navigation client-side
- Theming (dark/light) via next-themes sans flash (script inline dans head)
- Cookie consent RGPD present

---

## 5. Plan de correction

### Quick wins (impact immediat, peu d'effort)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 1 | Remplacer `getUser()` par `getSession()` dans le middleware | `src/lib/supabase/middleware.ts` | -100-300ms sur CHAQUE navigation |
| 2 | Remplacer `getUser()` par `getSession()` dans la page d'accueil | `src/app/page.tsx` | -100-300ms sur premiere visite |
| 3 | Remplacer `getUser()` par `getSession()` dans projects.ts | `src/lib/supabase/projects.ts` (x2) | -200-600ms sur pages projets |
| 4 | Ajouter `.limit(50)` sur getProjectsWithStats | `src/lib/supabase/projects.ts` | Protection contre le volume |
| 5 | Supprimer console.log dans create-project-dialog | `src/components/projects/create-project-dialog.tsx` | Proprete |
| 6 | Specifier les colonnes au lieu de `select("*")` | Multiples fichiers | Moins de transfert de donnees |

### Corrections structurelles (plus d'effort, gros impact)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 7 | Convertir le layout dashboard en Server Component | `src/app/dashboard/layout.tsx` | SSR du shell, elimination waterfall client, -300-500ms |
| 8 | Centraliser le fetch profil dans le layout (apres conversion SC) | Layout + pages | Elimination de 2-3 requetes dupliquees |
| 9 | Remplacer getUser par getSession partout sauf API routes sensibles | 10+ fichiers | -100-300ms par appel elimine |

### Ameliorations futures

| # | Action | Impact |
|---|--------|--------|
| 10 | Ajouter `<Suspense>` boundaries dans les pages | Rendu progressif |
| 11 | Ajouter `.limit(200)` sur les taches par projet | Garde-fou scalabilite |
| 12 | Cache SWR ou React Query pour les donnees client | Deduplication + UX |

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
| profiles.select(full_name, xp, level) | Layout useEffect (client) | reseau |
| auth.getUser() | Page server component | reseau |
| profiles.select(full_name, xp, level) | Page server component | reseau |
| tasks.select(count).eq(done) | Page server component | reseau |
| projects.select(count).eq(completed) | Page server component | reseau |
| **Total: 7 requetes** (dont getUser x3, profiles x2) | | |

### /dashboard/projects
| Requete | Origine | Type |
|---------|---------|------|
| auth.getUser() | Middleware | reseau |
| auth.getUser() | Layout useEffect (client) | reseau |
| profiles.select(full_name, xp, level) | Layout useEffect (client) | reseau |
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
| profiles.select(full_name, xp, level) | Layout useEffect (client) | reseau |
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
| profiles.select(full_name, xp, level) | Layout useEffect (client) | reseau |
| auth.getUser() | Settings useEffect (client) | reseau |
| profiles.select(full_name) | Settings useEffect (client) | reseau |
| **Total: 5 requetes** (dont getUser x3, profiles x2) | | |

---

## 7. Comparaison v2 -> v3

| Probleme v2 | Statut v3 |
|-------------|-----------|
| ELEVE -- Dashboard layout Client Component | PERSISTENT -- toujours "use client" avec useEffect |
| ELEVE -- Bundle lourd react-markdown + syntax-highlighter (~420KB) | CORRIGE -- chat/prompts supprimes, deps encore dans package.json |
| MOYEN -- Profil duplique layout/page | PERSISTENT -- layout (client) + page (server) fetchent chacun |
| MOYEN -- Prompts sans pagination | CORRIGE -- prompts supprimes |
| MOYEN -- ChatMessage sans React.memo | CORRIGE -- composant supprime |
| MOYEN -- page.tsx utilise getUser() | PERSISTENT -- toujours getUser() |
| MOYEN -- Variable redeclaree dans route chat | CORRIGE -- route chat supprimee |
| FAIBLE -- Pas de Suspense boundaries | PERSISTENT |
| FAIBLE -- Export non streame | PERSISTENT |
| NOUVEAU -- Middleware utilise getUser() (etait marque corrige en v2 mais ne l'est pas) | CRITIQUE |
| NOUVEAU -- getUser() utilise 12 fois, getSession() jamais | ELEVE |
| NOUVEAU -- select("*") x9 sans colonnes specifiques | MOYEN |
| NOUVEAU -- Aucune pagination nulle part | MOYEN |
| NOUVEAU -- console.log en production | FAIBLE |

---

## 8. Objectif v4

Passer de 5/10 a 7/10 en appliquant les quick wins :
- 0 appel `getUser()` dans le middleware (passer a `getSession()`)
- `getSession()` par defaut partout sauf API routes sensibles
- Layout dashboard converti en Server Component
- `.limit()` sur toutes les requetes sans borne
- Colonnes explicites dans les `select()` critiques
- Supprimer react-markdown et react-syntax-highlighter du package.json (deps orphelines)
