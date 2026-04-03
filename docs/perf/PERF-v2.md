# Audit Performance -- v2

Date: 2026-03-28
Version precedente: v1

## 1. Synthese

- Le middleware est desormais rapide (getSession au lieu de getUser) -- correction majeure de v1
- La page /dashboard est un Server Component avec `Promise.all` -- bon pattern
- Le layout dashboard reste un Client Component avec un fetch profil duplique dans un useEffect
- Aucun lazy-loading des dependances lourdes (~400KB react-markdown + syntax-highlighter)
- Aucune boundary `<Suspense>` ; un seul `loading.tsx` existe (dashboard root)
- La page prompts charge tout sans pagination ni limit

Score performance estime: **5/10**
Evolution: amelioration par rapport a v1 (etait 4/10)

---

## 2. Chemin critique d'une navigation

Quand l'utilisateur clique sur "Chat" depuis le dashboard :

| Etape | Action | Duree estimee |
|-------|--------|---------------|
| 1 | Middleware: `getSession()` (lecture cookie, pas d'appel reseau) | <5ms |
| 2 | Hydration JavaScript (layout = Client Component) | 50-100ms |
| 3 | Dashboard layout mount: `getSession()` + `profiles.select()` | 100-200ms |
| 4 | Chat page mount: `getSession()` + `conversations.select(*).limit(30)` | 150-400ms |
| **Total** | | **300ms - 700ms** |

Amelioration par rapport a v1 (~450ms-1.1s) grace au middleware rapide, mais le layout client ajoute toujours un waterfall.

---

## 3. Findings

### ELEVE -- Dashboard layout toujours en Client Component

**Fichier:** `src/app/dashboard/layout.tsx:1`
**Statut:** PERSISTENT depuis v1

Le layout est marque `"use client"` et fetche le profil dans un `useEffect` (ligne 18-35). Cela force toute l'arborescence dashboard a se charger cote client avant de pouvoir afficher quoi que ce soit. Le profil est deja fetche par la page dashboard server-side, ce qui cree une duplication.

**Impact:** Pas de rendu serveur pour le shell (sidebar, header). Waterfall systematique : hydration -> fetch profil -> rendu.

**Correction:** Convertir en Server Component. Fetcher le profil cote serveur. Isoler les parties interactives (sidebar toggle, mobile sidebar) dans de petits Client Components.

---

### ELEVE -- Bundle lourd non lazy-loaded (react-markdown + syntax-highlighter)

**Fichiers:** `src/components/chat-message.tsx:3-4`, `src/components/code-block.tsx:4-5`
**Statut:** PERSISTENT depuis v1

`react-markdown` (~50KB), `remark-gfm` (~20KB) et `react-syntax-highlighter` avec Prism (~350KB) sont importes statiquement. Ces modules sont inclus dans le bundle initial du chat.

**Impact:** ~420KB de JavaScript parse et execute au chargement de /dashboard/chat, meme si aucun message n'est affiche.

**Correction:** Utiliser `next/dynamic` avec `{ ssr: false }` pour `ChatMessage` ou au minimum pour `CodeBlock`. Le composant n'est necessaire qu'une fois qu'il y a des messages assistant a afficher.

---

### MOYEN -- Profil duplique entre layout et pages

**Fichiers:**
- `src/app/dashboard/layout.tsx:22-29` -- `getSession()` + `profiles.select(full_name)`
- `src/app/dashboard/page.tsx:10-15` -- `getSession()` + `profiles.select(full_name)` + counts
- `src/app/dashboard/settings/page.tsx:49-59` -- `getSession()` + `profiles.select(full_name)`

**Statut:** PERSISTENT depuis v1 (ameliore : plus de getUser dupliques, mais le pattern reste)

Le layout fetche le profil pour le header (userName), puis chaque page refetche independamment les memes donnees.

**Impact:** 2-3 requetes Supabase redondantes par navigation (getSession + profiles.select).

**Correction:** Centraliser le fetch profil dans le layout (converti en Server Component) et passer les donnees aux enfants via un contexte ou en lisant les donnees dans chaque page server-side sans refaire l'appel auth (Next.js deduplique les requetes fetch identiques dans le meme rendu serveur, mais pas les appels Supabase SDK).

---

### MOYEN -- Prompts charges sans pagination

**Fichier:** `src/app/dashboard/prompts/page.tsx:88-91`
**Statut:** PERSISTENT depuis v1

```
const { data } = await supabase
  .from("prompts")
  .select("*")
  .order("updated_at", { ascending: false });
```

Aucun `.limit()`. Tous les prompts sont charges d'un coup.

**Impact:** Negligeable avec peu de prompts, mais degrade avec le volume. Egalement present dans le PromptPicker (`src/components/prompt-picker.tsx:31-33`) qui charge tous les prompts a chaque ouverture du dialog.

**Correction:** Ajouter `.limit(50)` sur les deux requetes. Implementer un chargement incremental si necessaire.

---

### MOYEN -- ChatMessage sans React.memo

**Fichier:** `src/components/chat-message.tsx:13`
**Statut:** PERSISTENT depuis v1

`ChatMessage` recoit un objet `message` et re-rend `ReactMarkdown` a chaque mise a jour de state dans le parent. Pendant le streaming, chaque chunk provoque un `setMessages` qui map sur tous les messages (ligne 216-221 de chat/page.tsx), causant le re-render de TOUS les `ChatMessage` -- pas seulement celui en cours de streaming.

**Impact:** O(n * m) re-renders ou n = nombre de messages et m = nombre de chunks SSE. Perceptible des 10+ messages avec des reponses longues.

**Correction:** Wrapper `ChatMessage` dans `React.memo`. L'objet `message` ne change que pour le message en cours de streaming, donc memo bloquera les re-renders des autres messages.

---

### MOYEN -- Page d'accueil utilise getUser() au lieu de getSession()

**Fichier:** `src/app/page.tsx:8`
**Statut:** NOUVEAU

```
const { data: { user } } = await supabase.auth.getUser();
```

`getUser()` effectue un appel reseau vers Supabase pour valider le token. Comme cette page ne fait que rediriger, `getSession()` suffit.

**Impact:** 100-300ms ajoutes a la premiere visite (chaque chargement de `/`).

**Correction:** Remplacer `auth.getUser()` par `auth.getSession()` et utiliser `session?.user` pour la condition de redirection.

---

### MOYEN -- Variable redeclaree dans la route chat

**Fichier:** `src/app/api/chat/route.ts:16,45`
**Statut:** NOUVEAU

`body` est declare une premiere fois en ligne 16 (destructuring du Promise.all) puis redeclare en ligne 45 (`const body = ...`). Deux declarations `const` dans le meme scope `try` block.

**Impact:** Erreur de compilation TypeScript (`Cannot redeclare block-scoped variable 'body'`). Si le build passe malgre tout, c'est un risque de regression.

**Correction:** Renommer la seconde variable, par exemple `const stream = model.provider === "openrouter" ? ...`.

---

### FAIBLE -- Pas de Suspense boundaries dans les pages

**Fichier:** `src/app/dashboard/` (toutes les pages)
**Statut:** AMELIORE depuis v1 (loading.tsx existe maintenant)

`loading.tsx` existe et couvre les transitions de page, mais aucune boundary `<Suspense>` ne decoupe le contenu des pages. Le dashboard page, par exemple, attend que les 3 requetes `Promise.all` terminent avant d'afficher quoi que ce soit.

**Impact:** Leger. Le `loading.tsx` couvre deja le cas principal. Les Suspense boundaries seraient un plus pour afficher progressivement le contenu.

**Correction:** Ajouter `<Suspense fallback={<Skeleton />}>` autour des sections qui fetchent des donnees, par exemple les cards de compteurs sur /dashboard.

---

### FAIBLE -- Export de donnees non streame

**Fichier:** `src/app/api/account/export/route.ts:14-43`
**Statut:** PERSISTENT depuis v1

Charge toutes les conversations et messages en memoire avant de serialiser en JSON.

**Impact:** Negligeable en usage normal. Risque de timeout avec des centaines de conversations.

---

## 4. Points positifs

- Middleware rapide avec `getSession()` -- plus d'appel reseau bloquant (corrige depuis v1)
- Dashboard page est un vrai Server Component avec `Promise.all` pour des fetches paralleles
- `loading.tsx` dans le dashboard offre un feedback visuel pendant les transitions
- Client Supabase browser singleton (module-level) -- pas de recreations inutiles
- Pages chat et settings memoisent le client avec `useState(() => createClient())` -- evite les re-renders
- Conversations limitees a 30 dans le chat (`.limit(30)`)
- Streaming SSE pour les reponses chat -- bonne UX temps reel
- API route chat utilise `Promise.all` pour auth + body parsing en parallele (ligne 16)
- Rotation de cles API Mistral/OpenRouter pour eviter le rate limiting
- `next/link` utilise partout -- navigation client-side

---

## 5. Plan de correction

### Quick wins (impact immediat, peu d'effort)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 1 | Remplacer `getUser()` par `getSession()` dans la page d'accueil | `src/app/page.tsx` | -100-300ms sur premiere visite |
| 2 | Renommer la variable `body` redeclaree | `src/app/api/chat/route.ts` | Fix bug compilation |
| 3 | Ajouter `.limit(50)` sur les requetes prompts | `src/app/dashboard/prompts/page.tsx`, `src/components/prompt-picker.tsx` | Protection contre le volume |
| 4 | Wrapper `ChatMessage` dans `React.memo` | `src/components/chat-message.tsx` | Reduction des re-renders streaming |

### Corrections structurelles (plus d'effort, gros impact)

| # | Action | Fichier | Impact |
|---|--------|---------|--------|
| 5 | Convertir le layout dashboard en Server Component | `src/app/dashboard/layout.tsx` | Rendu serveur du shell, elimination du waterfall client |
| 6 | Lazy-load ChatMessage ou CodeBlock avec `next/dynamic` | `src/components/chat-message.tsx`, `src/components/code-block.tsx` | -400KB de JS initial sur /dashboard/chat |
| 7 | Centraliser le fetch profil (eliminer les doublons) | Layout + pages dashboard | -2-3 requetes par navigation |

### Ameliorations futures

| # | Action | Impact |
|---|--------|--------|
| 8 | Ajouter `<Suspense>` boundaries dans les pages | Rendu progressif |
| 9 | Infinite scroll pour les conversations | Scalabilite |
| 10 | Cache SWR ou React Query pour les donnees client | Deduplication + cache |

---

## 6. Requetes reseau par page

### / (page d'accueil)
| Requete | Origine |
|---------|---------|
| auth.getUser() | Page server component |
| **Total: 1 requete (reseau)** | |

### /dashboard (accueil)
| Requete | Origine |
|---------|---------|
| auth.getSession() | Middleware (cookie local) |
| auth.getSession() | Layout useEffect (client) |
| profiles.select(full_name) | Layout useEffect (client) |
| auth.getSession() | Page server component |
| profiles.select(full_name) | Page server component |
| conversations.select(count) | Page server component |
| prompts.select(count) | Page server component |
| **Total: 5 requetes Supabase** (dont 2 dupliquees layout/page) | |

### /dashboard/chat
| Requete | Origine |
|---------|---------|
| auth.getSession() | Middleware (cookie local) |
| auth.getSession() | Layout useEffect (client) |
| profiles.select(full_name) | Layout useEffect (client) |
| auth.getSession() | Chat page useEffect (client) |
| conversations.select(*).limit(30) | Chat page useEffect (client) |
| **Total: 3 requetes Supabase** (dont getSession x2) | |

### /dashboard/settings
| Requete | Origine |
|---------|---------|
| auth.getSession() | Middleware (cookie local) |
| auth.getSession() | Layout useEffect (client) |
| profiles.select(full_name) | Layout useEffect (client) |
| auth.getSession() | Settings useEffect (client) |
| profiles.select(full_name) | Settings useEffect (client) |
| **Total: 4 requetes Supabase** (dont getSession x2, profiles x2) | |

### /dashboard/prompts
| Requete | Origine |
|---------|---------|
| auth.getSession() | Middleware (cookie local) |
| auth.getSession() | Layout useEffect (client) |
| profiles.select(full_name) | Layout useEffect (client) |
| auth.getSession() | Prompts page useEffect (client) |
| prompts.select(*) | Prompts page useEffect (client) |
| **Total: 3 requetes Supabase** (dont getSession x2) | |

---

## 7. Comparaison v1 -> v2

| Probleme v1 | Statut v2 |
|-------------|-----------|
| CRITIQUE -- Middleware bloquant (getUser) | CORRIGE -- getSession() |
| CRITIQUE -- Appels auth dupliques (getUser x4-5) | AMELIORE -- getSession partout, mais doublons layout/page persistent |
| ELEVE -- Layout dashboard Client Component | PERSISTENT |
| ELEVE -- Aucun loading.tsx/Suspense | AMELIORE -- loading.tsx existe, pas de Suspense |
| MOYEN -- Pas de pagination | AMELIORE -- .limit(30) sur chat, mais prompts sans limit |
| MOYEN -- Bundle lourd non lazy-loaded | PERSISTENT |
| MOYEN -- Re-renders chat (client supabase) | AMELIORE -- client memoize, mais ChatMessage sans React.memo |
| FAIBLE -- Export non streame | PERSISTENT |

---

## 8. Objectif v3

Passer de 5/10 a 7/10 en corrigeant les quick wins et au moins une correction structurelle :
- 0 appel `getUser()` dans le projet (remplacer page.tsx)
- Fix du bug de redeclaration dans la route chat
- Layout dashboard converti en Server Component (plus gros impact)
- `ChatMessage` memoize avec `React.memo`
- Lazy-loading de react-markdown + syntax-highlighter via `next/dynamic`
- `.limit()` sur toutes les requetes Supabase
