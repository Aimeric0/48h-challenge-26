# Audit Performance — v1

Date: 2026-03-28

## 1. Synthese

La navigation entre pages est lente a cause d'un cumul de problemes :
- Le middleware appelle `auth.getUser()` sur **chaque requete**
- Les memes donnees (user, profil) sont re-fetchees 3 a 5 fois par navigation
- Toutes les pages dashboard sont des Client Components → pas de rendu serveur
- Aucun `loading.tsx` ni Suspense → ecran blanc pendant le chargement
- Aucune pagination → toutes les conversations/prompts charges d'un coup

Score performance estime: **4/10**

---

## 2. Chemin critique d'une navigation

Quand l'utilisateur clique sur "Chat" depuis le dashboard :

| Etape | Action | Duree estimee |
|-------|--------|---------------|
| 1 | Middleware: `auth.getUser()` | 100-300ms |
| 2 | Hydration JavaScript | 50-100ms |
| 3 | Dashboard layout mount: `auth.getUser()` + profil | 100-200ms |
| 4 | Chat page mount: `conversations.select(*)` | 200-500ms |
| **Total** | | **450ms - 1.1s** |

Le meme `auth.getUser()` est appele au minimum 2 fois (middleware + layout), parfois 3-4 fois (+ page + mutations).

---

## 3. Findings

### CRITIQUE — Middleware bloquant sur chaque requete

**Fichier:** `src/lib/supabase/middleware.ts`

Le middleware appelle `supabase.auth.getUser()` sur chaque requete HTTP (pages, API, etc.). C'est un appel reseau vers Supabase qui bloque le rendu.

**Impact:** 100-300ms de latence ajoutee a chaque navigation.

**Correction:** Utiliser `supabase.auth.getSession()` dans le middleware (lecture locale du cookie, pas d'appel reseau). Reserver `getUser()` pour les pages qui en ont besoin.

---

### CRITIQUE — Appels auth dupliques

**Fichiers concernes:**
- `src/lib/supabase/middleware.ts` → `getUser()` (chaque requete)
- `src/app/dashboard/layout.tsx` → `getUser()` + query profil (chaque mount)
- `src/app/dashboard/page.tsx` → `getUser()` + query profil + counts
- `src/app/dashboard/chat/page.tsx` → `getUser()` dans sendMessage
- `src/app/dashboard/settings/page.tsx` → `getUser()` x2

**Impact:** 4-5 requetes Supabase auth par navigation au lieu de 1.

**Correction:** Centraliser le fetch user/profil dans le layout (une seule fois), passer les donnees aux enfants via props ou contexte.

---

### ELEVE — Dashboard layout en Client Component

**Fichier:** `src/app/dashboard/layout.tsx`

Le layout dashboard est marque `"use client"`, ce qui force tout le sous-arbre a se charger cote client. Le profil est fetche dans un `useEffect` apres hydration.

**Impact:** Pas de rendu serveur, pas de streaming, temps de chargement perceptible.

**Correction:** Convertir en Server Component. Fetcher le profil cote serveur et le passer aux enfants. Isoler les parties interactives (sidebar toggle) dans des Client Components separes.

---

### ELEVE — Aucun loading.tsx ni Suspense

**Constat:** Aucun fichier `loading.tsx` dans tout le projet. Aucune boundary `<Suspense>`.

**Impact:** L'utilisateur voit un ecran blanc ou fige entre les navigations. Pas de rendu progressif.

**Correction:** Ajouter un `loading.tsx` dans `src/app/dashboard/` avec un skeleton de la page. Ajouter des `<Suspense>` autour des composants qui fetchent des donnees.

---

### MOYEN — Pas de pagination

**Fichiers:** `src/app/dashboard/chat/page.tsx`, `src/app/dashboard/prompts/page.tsx`

Les conversations et prompts sont charges integralement (`select("*")` sans `limit`).

**Impact:** Performant avec peu de donnees, mais degrade lineairement. 50+ conversations = lenteur perceptible.

**Correction:** Ajouter `.limit(20)` et implementer un chargement incremental (infinite scroll ou bouton "charger plus").

---

### MOYEN — Bundle lourd (react-markdown + syntax highlighter)

**Dependances:**
- `react-markdown` (~50KB)
- `react-syntax-highlighter` + Prism.js (~350KB)
- `remark-gfm` (~20KB)

**Impact:** ~400KB+ de JS parse et execute au chargement du chat.

**Correction:** Lazy-load ces composants avec `React.lazy()` + `<Suspense>`. Ils ne sont necessaires que quand il y a des messages a afficher.

---

### MOYEN — Re-renders inutiles dans le chat

**Fichier:** `src/app/dashboard/chat/page.tsx`

- Le client Supabase est cree au niveau du composant sans memoisation
- Les callbacks dependent de `supabase` ce qui peut causer des re-renders en boucle
- `ChatMessage` n'est pas memoize avec `React.memo`

**Impact:** Re-renders frequents pendant le streaming des reponses.

**Correction:** Memoiser le client Supabase, wrapper `ChatMessage` dans `React.memo`.

---

### FAIBLE — Export de donnees non streame

**Fichier:** `src/app/api/account/export/route.ts`

Charge toutes les conversations et messages en memoire avant de repondre. Peut timeout avec beaucoup de donnees.

**Impact:** Negligeable pour un usage normal, problematique avec des centaines de conversations.

---

## 4. Points positifs

- `next/link` utilise partout dans la sidebar et le dashboard → navigation client-side (pas de full reload)
- Client Supabase singleton cote navigateur (cree une seule fois)
- Streaming SSE pour les reponses chat → bonne UX en temps reel
- Pas de bibliotheques lourdes inutiles (pas d'analytics, pas de framework CSS lourd)

---

## 5. Plan de correction

### Quick wins (impact immediat, peu d'effort)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 1 | Remplacer `getUser()` par `getSession()` dans le middleware | `src/lib/supabase/middleware.ts` | -100-300ms par navigation |
| 2 | Ajouter `loading.tsx` dans le dashboard | `src/app/dashboard/loading.tsx` | Perception de rapidite |
| 3 | Limiter les conversations a 30 | `src/app/dashboard/chat/page.tsx` | Moins de donnees a charger |

### Corrections structurelles (plus d'effort, gros impact)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 4 | Convertir le layout dashboard en Server Component | `src/app/dashboard/layout.tsx` | Elimination des fetches client |
| 5 | Centraliser user/profil dans le layout et passer en props | Layout + pages | -3-4 requetes par navigation |
| 6 | Lazy-load react-markdown et syntax highlighter | `src/components/chat-message.tsx` | -400KB de JS initial |

### Ameliorations futures

| # | Action | Impact |
|---|--------|--------|
| 7 | Infinite scroll pour les conversations | Scalabilite |
| 8 | React.memo sur ChatMessage | Moins de re-renders |
| 9 | SWR ou React Query pour le cache des requetes | Cache + deduplication |

---

## 6. Requetes reseau par page

### /dashboard (accueil)
| Requete | Origine |
|---------|---------|
| auth.getUser() | Middleware |
| auth.getUser() | Layout useEffect |
| profiles.select() | Layout useEffect |
| auth.getUser() | Page server component |
| profiles.select() | Page server component |
| conversations.select(count) | Page server component |
| **Total: 6 requetes** | |

### /dashboard/chat
| Requete | Origine |
|---------|---------|
| auth.getUser() | Middleware |
| auth.getUser() | Layout useEffect |
| profiles.select() | Layout useEffect |
| conversations.select(*) | Chat page useEffect |
| **Total: 4 requetes** | |

### /dashboard/settings
| Requete | Origine |
|---------|---------|
| auth.getUser() | Middleware |
| auth.getUser() | Layout useEffect |
| profiles.select() | Layout useEffect |
| auth.getUser() | Settings useEffect |
| profiles.select() | Settings useEffect |
| **Total: 5 requetes** | |

---

## 7. Objectif v2

Reduire les requetes a 1-2 par navigation et garantir un affichage en moins de 300ms :
- 1 `getSession()` dans le middleware (pas d'appel reseau)
- 1 `getUser()` + profil dans le layout server (une seule fois)
- 0 fetch supplementaire dans les pages pour l'auth
- `loading.tsx` pour un affichage instantane pendant le chargement des donnees
