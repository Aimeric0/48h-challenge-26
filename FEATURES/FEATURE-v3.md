# FEATURE-v3 -- Etat des features actuelles

Date: 2026-03-31
Version precedente: v2

## Authentification

### Inscription
- Formulaire email + mot de passe + nom complet
- Case de consentement obligatoire avant soumission (lien vers /privacy)
- Validation client : mot de passe minimum 6 caracteres, tous les champs requis
- Creation automatique du profil via trigger Supabase (`handle_new_user()`)
- Redirection vers `/dashboard` apres inscription
- **Statut:** OK
- **Fichiers:** `src/app/(auth)/register/page.tsx`, `supabase/schema.sql`

### Confirmation email
- Aucun flux de verification email implemente
- L'utilisateur accede immediatement au dashboard sans confirmer son email
- **Statut:** Non implemente

### Connexion
- Formulaire email + mot de passe
- Authentification via `supabase.auth.signInWithPassword()`
- Message d'erreur generique en cas d'echec
- Redirection vers `/dashboard` apres connexion
- Protection des routes `/dashboard/*` via middleware Supabase SSR
- Redirection automatique des utilisateurs authentifies depuis `/login`, `/register`, `/forgot-password` vers `/dashboard`
- **Statut:** OK
- **Fichiers:** `src/app/(auth)/login/page.tsx`, `src/lib/supabase/middleware.ts`, `src/proxy.ts`

### Mot de passe oublie
- Formulaire de saisie d'email sur `/forgot-password`
- Envoi d'un email de reinitialisation via `supabase.auth.resetPasswordForEmail()`
- URL de redirection : `${window.location.origin}/reset-password`
- Page dediee `/reset-password` avec formulaire de nouveau mot de passe + confirmation
- Ecoute de l'evenement `PASSWORD_RECOVERY` via `onAuthStateChange` pour valider la session
- Validation : minimum 6 caracteres, correspondance des deux champs
- Redirection automatique vers `/dashboard` apres succes (delai 2s)
- Le middleware exclut `/reset-password` des redirections auth
- **Statut:** OK
- **Fichiers:** `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/lib/supabase/middleware.ts`
- **Complete depuis v2** (v2 signalait "En cours" car la page de reset manquait)

### Deconnexion
- Bouton dans le menu dropdown du header
- Appelle `supabase.auth.signOut()` puis redirige vers `/login`
- `router.refresh()` pour nettoyer le cache
- **Statut:** OK
- **Fichiers:** `src/components/header.tsx`

## Dashboard

### Page d'accueil
- Message de bienvenue avec le prenom de l'utilisateur
- Carte XP avec barre de progression, niveau, titre et XP
- 4 cartes de stats : Taches terminees (+10 XP par tache), Projets termines (+50 XP par projet), XP Total, lien vers Parametres
- Chargement server-side avec `getUser()` + `profiles.select()` + counts
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/page.tsx`, `src/components/xp-bar.tsx`
- **Modifie depuis v2** (les cartes affichent desormais des stats de gamification au lieu de conversations/prompts)

## Gestion de projets

### Liste des projets
- Page server component qui charge les projets via `getProjectsWithStats()`
- Vue grille (ProjectCard) et vue liste (ProjectListRow) avec toggle
- Recherche par nom/description
- Filtrage par statut : Tous / En cours / Planifie / Termine
- Chaque carte affiche : nom, description, statut, deadline, progression, nombre de taches, avatars des membres, alerte retard
- Etat vide avec invitation a creer un premier projet
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/projects/page.tsx`, `src/components/projects/projects-page-client.tsx`, `src/components/projects/project-card.tsx`
- **Nouveau depuis v2**

### Creation de projet
- Dialog modal avec : nom (requis), description, date limite
- Insert dans `projects` + ajout de l'utilisateur comme member `owner`
- Fetch du profil pour construire l'objet complet cote client
- Mise a jour optimiste de la liste (pas de rechargement)
- **Statut:** OK
- **Fichiers:** `src/components/projects/create-project-dialog.tsx`
- **Nouveau depuis v2**

### Detail d'un projet
- Page server component qui charge projet + taches + membres via `getProjectById()`
- Header avec nom, description, statut (select modifiable), deadline, createur
- Bouton "Supprimer" visible uniquement par le owner (avec AlertDialog de confirmation)
- 4 cartes de stats : Progression %, A faire, En cours, En retard
- Barre de progression globale
- Board Kanban complet (voir section dediee)
- Carte membres avec avatars, noms, roles
- Bouton retour vers la liste des projets
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/projects/[id]/page.tsx`, `src/components/projects/project-detail-client.tsx`
- **Nouveau depuis v2**

### Changement de statut de projet
- Select avec 3 options : Planifie / En cours / Termine
- Mise a jour directe en base via Supabase client
- Declenche le trigger de gamification (50 XP par membre si passe a "completed")
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-status-select.tsx`
- **Nouveau depuis v2**

### Suppression de projet
- Reserve au owner
- AlertDialog de confirmation avec message d'irreversibilite
- Suppression en cascade (membres, taches) grace aux FK `on delete cascade`
- Redirection vers `/dashboard/projects` apres suppression
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`
- **Nouveau depuis v2**

### Invitation de membres
- Dialog de recherche par email
- Recherche dans la table `profiles`
- Verification que l'utilisateur n'est pas deja membre
- Affichage du profil trouve (avatar + nom + email)
- Ajout comme `member` dans `project_members`
- Mise a jour optimiste de la liste des membres
- Bouton visible uniquement par le owner
- **Statut:** OK
- **Fichiers:** `src/components/projects/add-member-dialog.tsx`
- **Nouveau depuis v2**

### Suppression de membres
- Bouton X au hover sur chaque membre (sauf owner)
- Reserve au owner du projet
- Suppression directe dans `project_members`
- Mise a jour optimiste de la liste
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`
- **Nouveau depuis v2**

## Gestion de taches

### Creation de tache
- Dialog modal avec : titre (requis), description, statut (5 options), assigne (membres du projet ou "Non assigne"), date limite
- Calcul automatique de la position (max position + 1 dans la colonne cible)
- Mise a jour optimiste de la liste
- Toast de succes
- **Statut:** OK
- **Fichiers:** `src/components/projects/create-task-dialog.tsx`
- **Nouveau depuis v2**

### Modification de tache (statut)
- Select avec 5 statuts : Backlog / A faire / En cours / En revue / Termine
- Mise a jour directe en base
- Declenche le trigger de gamification (10 XP si passe a "done")
- **Statut:** OK
- **Fichiers:** `src/components/projects/task-status-select.tsx`
- **Nouveau depuis v2**

### Suppression de tache
- Bouton X au hover sur chaque carte de tache dans le Kanban
- Suppression directe sans confirmation
- Mise a jour optimiste de la liste
- Toast d'erreur si echec
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`
- **Nouveau depuis v2**

### Board Kanban
- 5 colonnes : Backlog, A faire, En cours, En revue, Termine
- Drag & drop complet avec dnd-kit (PointerSensor + KeyboardSensor)
- Deplacement entre colonnes avec mise a jour du statut en base
- Reordonnancement vertical dans une colonne avec mise a jour des positions en batch (RPC `batch_update_task_positions`)
- Overlay visuel pendant le drag (DragOverlay)
- Feedback visuel : carte semi-transparente a l'emplacement d'origine, ring sur la colonne cible
- Chaque carte affiche : poignee de drag, titre, description (2 lignes max), deadline (badge colore si en retard), avatar assigne
- Colonnes avec compteur de taches dans un badge
- Etat vide par colonne : "Glissez une tache ici"
- ScrollArea horizontal pour les 5 colonnes
- **Statut:** OK
- **Fichiers:** `src/components/projects/kanban-board.tsx`
- **Nouveau depuis v2**

## Gamification

### Systeme XP
- 10 XP par tache completee (trigger `on_task_completed`)
- 50 XP par projet complete (trigger `on_project_completed`, distribue a tous les membres)
- XP retire si une tache/projet est remis dans un statut non-complete (undo)
- Colonnes `xp` et `level` ajoutees a la table `profiles`
- Fonction `add_xp()` en SQL (security definer)
- **Statut:** OK
- **Fichiers:** `supabase/migrations/20260331_gamification.sql`, `src/lib/gamification.ts`
- **Nouveau depuis v2**

### Systeme de niveaux
- Calcul dynamique du niveau a partir de l'XP via `calculate_level()` en SQL
- Progression exponentielle : chaque niveau necessite plus d'XP (level * 50 supplementaires)
- 7 titres : Debutant (1-2), Junior (3-4), Intermediaire (5-6), Confirme (7-9), Senior (10-14), Expert (15-19), Architecte (20+)
- Fonctions helpers TypeScript : `xpForLevel`, `xpForNextLevel`, `getLevelProgress`, `getLevelTitle`
- **Statut:** OK
- **Fichiers:** `src/lib/gamification.ts`
- **Nouveau depuis v2**

### Affichage XP
- Composant `XpBar` avec 2 modes : compact (header) et full (dashboard)
- Mode compact : badge "Niv. X" avec etoile + mini barre de progression + tooltip avec details
- Mode full : icone etoile, niveau, titre, barre de progression gradient, XP courant/requis
- Affiche dans le header (compact) et sur la page dashboard (full)
- **Statut:** OK
- **Fichiers:** `src/components/xp-bar.tsx`
- **Nouveau depuis v2**

### Badges
- Non implemente. Pas de schema DB, pas de logique, pas d'UI.
- **Statut:** Non implemente

### Streaks (series de jours actifs)
- Non implemente. Pas de tracking de l'activite quotidienne.
- **Statut:** Non implemente

### Classement d'equipe
- Non implemente. Pas de leaderboard.
- **Statut:** Non implemente

## Profil et parametres

### Modification du profil
- Modification du nom complet (update table `profiles`)
- Modification de l'email (via `supabase.auth.updateUser()`)
- Feedback : alertes de succes et d'erreur
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`

### Avatar
- Champ `avatar_url` present en base (table `profiles`)
- Initiales affichees partout (header, membres, kanban)
- Aucun upload ni affichage d'image
- **Statut:** Non implemente

### Themes
- Mode clair / sombre / systeme via `next-themes`
- Toggle rapide dans le header (icone soleil/lune)
- 7 couleurs d'accent dans les parametres : Defaut, Classique, Amethyste, Jade, Automne, Sakura, Poussin
- Persistence en localStorage
- Script anti-FOUC dans le head
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/lib/themes.ts`, `src/components/color-theme-provider.tsx`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`

### Export de donnees
- Telechargement JSON contenant : profil, conversations, messages, date d'export
- Fichier nomme `mes-donnees.json`
- Bouton dans les parametres avec spinner de chargement
- Lien vers la politique de confidentialite
- **Statut:** OK (mais exporte conversations/messages qui n'existent plus dans l'UI -- voir note)
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/export/route.ts`
- **Note:** L'export reference les tables `conversations` et `messages` qui ne sont plus utilisees dans l'app (chat supprime). L'export devrait inclure les projets et taches a la place.

### Suppression de compte
- Bouton dans la zone de danger (bordure rouge)
- Dialog de confirmation avec avertissement irreversible
- Suppression via admin client Supabase (`auth.admin.deleteUser`)
- Deconnexion et redirection vers `/login`
- Donnees en cascade supprimees grace aux FK `on delete cascade`
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/delete/route.ts`, `src/lib/supabase/admin.ts`

### Changement de mot de passe
- Aucune interface dans les parametres (mais possible via forgot-password/reset-password)
- **Statut:** Non implemente (dans les parametres)

## Interface et UX

### Navigation
- Sidebar desktop collapsible (64px / 256px) avec 3 liens : Accueil, Projets, Parametres
- Sidebar mobile via Sheet (drawer) avec les memes 3 liens
- Header fixe (56px) avec : bouton menu (mobile), XpBar compact, toggle theme, menu dropdown utilisateur
- Menu dropdown : nom, Parametres, Profil (doublon avec Parametres), Deconnexion
- Liens legaux dans le footer de la sidebar : Confidentialite, Mentions legales
- Transitions fluides (300ms)
- **Statut:** OK
- **Fichiers:** `src/components/sidebar.tsx`, `src/components/mobile-sidebar.tsx`, `src/components/header.tsx`, `src/app/dashboard/layout.tsx`

### Cookie consent
- Bandeau fixe en bas de page (z-50)
- Message : cookies d'authentification uniquement, pas de tracking
- Bouton "Compris" pour fermer
- Lien vers la politique de confidentialite
- Persistence en localStorage (`cookie-notice-dismissed`)
- **Statut:** OK
- **Fichiers:** `src/components/cookie-consent.tsx`

### Responsive
- Layout adaptatif : sidebar desktop cachee sur mobile, sheet drawer
- Grilles responsives pour les projets (1 / 2 / 3 cols) et les stats (2 / 4 cols)
- Kanban en ScrollArea horizontal (min-width 800px)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/layout.tsx`, pages et composants

### Toast notifications
- Sonner integre (position bottom-right, richColors)
- Utilise pour : creation de tache, erreurs kanban, erreurs suppression
- **Statut:** OK
- **Fichiers:** `src/app/layout.tsx`, composants projets
- **Nouveau depuis v2**

### Composants UI (shadcn/ui)
- Alert, AlertDialog, Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, ScrollArea, Select, Separator, Sheet, Tabs, Textarea, Tooltip, Sonner (Toaster)
- Total : 18 composants
- **Statut:** OK
- **Fichiers:** `src/components/ui/`

### Page d'accueil publique
- Pas de landing page : `/` redirige vers `/dashboard` (connecte) ou `/login` (non connecte)
- **Statut:** Non implemente

## Pages legales

### Politique de confidentialite
- 9 sections : Responsable, Donnees collectees, Finalites, Destinataires, Sous-traitants, Duree de conservation, Droits RGPD, Cookies, Securite
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/privacy/page.tsx`

### Mentions legales
- 4 sections : Editeur, Hebergement (Vercel + Supabase Frankfurt), Propriete intellectuelle, Donnees personnelles
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/mentions-legales/page.tsx`

### Layout legal
- Container centre max-w-3xl avec bouton retour
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/layout.tsx`

## API Routes

| Route | Methode | Auth | Description | Statut |
|-------|---------|------|-------------|--------|
| `/api/account/delete` | DELETE | Oui (getUser) | Supprime le compte via admin client, cascade sur toutes les donnees | OK |
| `/api/account/export` | GET | Oui (getUser) | Exporte profil + conversations + messages en JSON | OK (a mettre a jour -- exporte les anciennes tables chat) |

## Serveur MCP

### Tools (16)

| Nom | Description | Statut |
|-----|-------------|--------|
| `list_projects` | Lister les projets (optionnel : filtre par user) | OK |
| `create_project` | Creer un projet (nom, description, deadline) | OK |
| `list_tasks` | Lister les taches d'un projet (filtre : statut) | OK |
| `create_task` | Creer une tache (titre, description, assignation) | OK |
| `update_task` | Modifier statut, assignation, deadline | OK |
| `delete_task` | Supprimer une tache par ID | OK |
| `assign_task` | Assigner/reassigner une tache | OK |
| `get_project_summary` | Resume complet du projet | OK |
| `get_project_stats` | Stats : completion, velocite, retard | OK |
| `list_members` | Lister les membres avec profils et roles | OK |
| `invite_member` | Inviter par email | OK |
| `get_overdue_tasks` | Taches en retard (global ou par projet) | OK |
| `get_user_tasks` | Taches assignees a un utilisateur | OK |
| `get_user_by_email` | Rechercher un utilisateur par email | OK |
| `get_current_user` | Info de l'utilisateur MCP connecte | OK |
| `update_profile` | Modifier le profil (nom) | OK |

### Resources (2)

| Nom | URI | Description | Statut |
|-----|-----|-------------|--------|
| `project` | `project://<id>` | Snapshot JSON complet d'un projet | OK |
| `user-projects` | `projects://<userId>` | Liste des projets d'un utilisateur | OK |

### Prompts (3)

| Nom | Description | Statut |
|-----|-------------|--------|
| `standup` | Template de daily standup avec contexte projet | OK |
| `retrospective` | Template de retrospective sprint | OK |
| `task_breakdown` | Decomposition d'un objectif en sous-taches | OK |

### Configuration
- Transport stdio avec authentification user (email/password via env)
- Validation des inputs via zod
- Gestion d'erreurs structuree
- **Fichiers:** `mcp/server.ts`, `mcp/tools/` (16 fichiers), `mcp/resources/` (2 fichiers), `mcp/prompts/` (3 fichiers), `.mcp.json`

## Base de donnees

### Tables

| Table | Colonnes principales | RLS |
|-------|---------------------|-----|
| `profiles` | id (PK, FK auth.users), email, full_name, avatar_url, xp, level, created_at, updated_at | Oui (SELECT tous authentifies, INSERT/UPDATE/DELETE par owner) |
| `projects` | id (PK), name, description, status (planned/in_progress/completed), deadline, owner_id (FK), created_at, updated_at | Oui (SELECT owner+members, INSERT/UPDATE/DELETE owner) |
| `project_members` | project_id + user_id (PK composite), role (owner/member), joined_at | Oui (SELECT members, INSERT owner ou self-insert owner, DELETE owner) |
| `tasks` | id (PK), project_id (FK), title, description, status (todo/in_progress/done), assignee_id (FK, nullable), deadline, position, created_at, updated_at | Oui (SELECT/INSERT/UPDATE/DELETE par members) |
| `conversations` | id (PK), user_id (FK), title, created_at, updated_at | Oui (orpheline -- plus utilisee dans l'app) |
| `messages` | id (PK), conversation_id (FK), role, content, created_at | Oui (orpheline -- plus utilisee dans l'app) |

### Fonctions et triggers

| Nom | Declencheur | Action |
|-----|-------------|--------|
| `handle_new_user()` | AFTER INSERT sur auth.users | Cree un profil dans profiles |
| `update_updated_at()` | BEFORE UPDATE sur profiles, conversations, projects, tasks | Met a jour updated_at |
| `is_project_member()` | Fonction helper | Verifie l'appartenance a un projet (security definer) |
| `is_project_owner()` | Fonction helper | Verifie la propriete d'un projet (security definer) |
| `batch_update_task_positions()` | RPC | Met a jour les positions de taches en batch (JSON array) |
| `calculate_level()` | Fonction pure | Calcule le niveau a partir de l'XP |
| `xp_for_next_level()` | Fonction pure | XP requis pour le prochain niveau |
| `add_xp()` | Fonction utilitaire | Ajoute de l'XP et recalcule le niveau (security definer) |
| `on_task_completed()` | AFTER UPDATE sur tasks | +10 XP si statut passe a done, -10 XP si undo |
| `on_project_completed()` | AFTER UPDATE sur projects | +50 XP a tous les membres si statut passe a completed |

### Indexes
- `idx_project_members_user` sur project_members(user_id)
- `idx_tasks_project` sur tasks(project_id)
- `idx_tasks_assignee` sur tasks(assignee_id)
- `idx_tasks_status` sur tasks(status)

### Migrations
- `supabase/schema.sql` -- schema principal
- `supabase/migrations/20260330_batch_update_task_positions.sql` -- RPC batch positions
- `supabase/migrations/20260331_gamification.sql` -- XP, niveaux, triggers

### Incoherence detectee
- La table `tasks` en SQL a un check constraint `status in ('todo', 'in_progress', 'done')` (3 statuts)
- Le TypeScript definit `TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'` (5 statuts)
- Le Kanban a 5 colonnes incluant "Backlog" et "En revue"
- Les taches avec statut `backlog` ou `review` seront rejetees par la base de donnees
- **Impact:** Les colonnes Backlog et En revue sont inutilisables. Les inserts/updates echoueront silencieusement.

---

## Evolution depuis v2

### Features ajoutees
- Gestion de projets complete (CRUD, statuts, deadlines, invitation membres, suppression membres)
- Gestion de taches complete (CRUD, assignation, 5 statuts dans l'UI, deadlines)
- Board Kanban avec drag & drop (dnd-kit, 5 colonnes, reordonnancement, persistence)
- Gamification (XP, niveaux, titres, triggers SQL, barre de progression)
- Dashboard refait avec stats de gamification (taches/projets termines, XP)
- Toast notifications via Sonner
- Page reset-password complete (complete le flux forgot-password)
- MCP : tools update_profile, get_current_user
- MCP : resource user-projects (projects://<userId>)
- 4 composants UI supplementaires (AlertDialog, Select, Tooltip, Sonner)

### Features completees (etaient "en cours")
- Mot de passe oublie -- page `/reset-password` ajoutee avec formulaire complet

### Features supprimees
- Chat (conversations, messagerie, streaming, modeles, modes rapide/precis)
- Prompts (CRUD, categories, prompts par defaut, insertion dans le chat)
- Rendu markdown (react-markdown, remark-gfm)
- Coloration syntaxique (react-syntax-highlighter)
- Selection de modeles IA (Mistral, OpenRouter)
- Truncation de contexte
- API route `/api/chat`

### Suggestions v2 implementees
- Page de reset mot de passe (OK)
- Toast notifications (OK)

### Suggestions v2 non implementees
- Table prompts dans schema.sql (non applicable, prompts supprimes)
- Changement de mot de passe dans les parametres
- Recherche dans les conversations (non applicable, chat supprime)
- Pagination (aucune pagination implementee)
- Rate limiting
- Landing page publique
- Upload avatar

---

## Problemes detectes

1. **Incoherence statuts taches DB/UI** -- La base de donnees n'accepte que 3 statuts (todo, in_progress, done) mais l'UI propose 5 statuts (backlog, todo, in_progress, review, done). Les colonnes Backlog et En revue sont cassees.
2. **Export de donnees obsolete** -- L'endpoint `/api/account/export` exporte conversations et messages (tables du chat supprime) au lieu de projets, taches et membres.
3. **Dependencies orphelines** -- react-markdown, remark-gfm, react-syntax-highlighter, @tailwindcss/typography sont dans package.json mais plus utilises.
4. **Tables orphelines** -- Les tables `conversations` et `messages` dans schema.sql ne sont plus utilisees par l'app.

---

## Suggestions pour FEATURE-v4

1. **Corriger le check constraint des statuts taches** -- Ajouter `backlog` et `review` au check constraint SQL ou retirer les 2 colonnes du Kanban. Impact critique : les colonnes sont actuellement cassees.
2. **Mettre a jour l'export de donnees** -- Exporter projets, taches et membres au lieu de conversations/messages. Impact RGPD.
3. **Nettoyer les dependances** -- Supprimer react-markdown, remark-gfm, react-syntax-highlighter, @tailwindcss/typography. Impact bundle.
4. **Badges de gamification** -- Schema DB + UI pour des badges (premiere tache, 10 taches, premier projet...). Impact engagement.
5. **Streaks** -- Tracking de l'activite quotidienne avec compteur de jours consecutifs. Impact engagement.
6. **Changement de mot de passe** -- Ajouter un formulaire dans les parametres. Impact UX basique attendu.
7. **Upload avatar** -- Utiliser Supabase Storage pour l'upload et l'affichage. Impact UX.
8. **Landing page** -- Page marketing sur `/` au lieu d'une redirection. Impact acquisition.
