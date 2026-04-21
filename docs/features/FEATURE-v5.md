# FEATURE-v5 -- Etat des features actuelles

Date: 2026-04-03
Version precedente: v4

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
- **Fichiers:** `src/app/(auth)/login/page.tsx`, `src/lib/supabase/middleware.ts`, `src/lib/proxy.ts`

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

### Deconnexion
- Bouton dans le menu dropdown du header
- Appelle `supabase.auth.signOut()` puis redirige vers `/login`
- `router.refresh()` pour nettoyer le cache
- **Statut:** OK
- **Fichiers:** `src/components/layout/header.tsx`

## Dashboard

### Page d'accueil
- Message de bienvenue avec le prenom de l'utilisateur
- Carte XP avec barre de progression, niveau, titre et XP
- Grille de badges (12 badges) avec compteur debloque/total et barres de progression sur les badges verrouilles
- 4 cartes de stats : Taches terminees (+10 XP), Projets termines (+50 XP), XP Total, Streak (jours consecutifs)
- Heatmap d'activite style GitHub (16 semaines)
- Chargement server-side avec `getUser()` + `profiles.select()` + counts + RPC
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/page.tsx`, `src/components/gamification/xp-bar.tsx`, `src/components/gamification/badges-grid.tsx`, `src/components/gamification/activity-heatmap.tsx`
- **Modifie depuis v4** (ajout heatmap, carte streak, 12 badges au lieu de 5, dates de debloquage)

### Landing page publique
- Page marketing complete sur `/` avec 5 sections
- Header sticky avec navigation contextuelle (authentifie vs non-authentifie)
- Hero avec gradient, headline, CTA, badges decoratifs
- Grille de 4 features (Kanban, Gamification, Collaboration, Assistant IA MCP)
- Section highlights avec apercu decoratif
- Banner CTA gradient (violet/pink)
- Footer avec copyright et liens legaux
- **Statut:** OK
- **Fichiers:** `src/app/page.tsx`
- **Nouveau depuis v4** (etait "Non implemente" en v4)

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

### Creation de projet
- Dialog modal avec : nom (requis), description, date limite
- Insert dans `projects` + ajout de l'utilisateur comme member `owner`
- Fetch du profil pour construire l'objet complet cote client
- Mise a jour optimiste de la liste (pas de rechargement)
- **Statut:** OK
- **Fichiers:** `src/components/projects/create-project-dialog.tsx`

### Detail d'un projet
- Page server component qui charge projet + taches + membres via `getProjectById()`
- Header avec nom, description, statut (select modifiable), deadline, createur
- Bouton "Supprimer" visible uniquement par le owner (avec AlertDialog de confirmation)
- 4 cartes de stats : Progression %, A faire, En cours, En retard
- Barre de progression globale
- Board Kanban complet (voir section dediee)
- Classement d'equipe (TeamLeaderboard) et carte membres cote a cote
- Bouton retour vers la liste des projets
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/projects/[id]/page.tsx`, `src/components/projects/project-detail-client.tsx`

### Changement de statut de projet
- Select avec 3 options : Planifie / En cours / Termine
- Mise a jour directe en base via Supabase client
- Declenche le trigger de gamification (50 XP par membre si passe a "completed")
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-status-select.tsx`

### Suppression de projet
- Reserve au owner
- AlertDialog de confirmation avec message d'irreversibilite
- Suppression en cascade (membres, taches) grace aux FK `on delete cascade`
- Redirection vers `/dashboard/projects` apres suppression
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`

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

### Suppression de membres
- Bouton X au hover sur chaque membre (sauf owner)
- Reserve au owner du projet
- Suppression directe dans `project_members`
- Mise a jour optimiste de la liste
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`

## Gestion de taches

### Creation de tache
- Dialog modal avec : titre (requis), description, statut (5 options), assigne (membres du projet ou "Non assigne"), date limite
- Calcul automatique de la position (max position + 1 dans la colonne cible)
- Mise a jour optimiste de la liste
- Toast de succes
- **Statut:** OK
- **Fichiers:** `src/components/projects/create-task-dialog.tsx`

### Modification de tache (statut)
- Select avec 5 statuts : Backlog / A faire / En cours / En revue / Termine
- Mise a jour directe en base
- Declenche le trigger de gamification (10 XP si passe a "done")
- Auto-assignation de l'utilisateur courant si tache non assignee passee a "done"
- **Statut:** OK
- **Fichiers:** `src/components/projects/task-status-select.tsx`
- **Modifie depuis v4** (le check constraint SQL supporte maintenant les 5 statuts)

### Suppression de tache
- Bouton X au hover sur chaque carte de tache dans le Kanban
- Suppression directe sans confirmation
- Mise a jour optimiste de la liste
- Toast d'erreur si echec
- **Statut:** OK
- **Fichiers:** `src/components/projects/project-detail-client.tsx`

### Board Kanban
- 5 colonnes : Backlog, A faire, En cours, En revue, Termine
- Drag & drop complet avec dnd-kit (PointerSensor + KeyboardSensor, distance minimale 5px)
- Deplacement entre colonnes avec mise a jour du statut en base
- Reordonnancement vertical dans une colonne avec mise a jour des positions en batch (RPC `batch_update_task_positions`)
- Overlay visuel pendant le drag (DragOverlay)
- Feedback visuel : carte semi-transparente a l'emplacement d'origine, ring sur la colonne cible
- Chaque carte affiche : poignee de drag, titre, description (2 lignes max), deadline (badge colore si en retard), avatar assigne
- Colonnes avec compteur de taches dans un badge
- Etat vide par colonne : "Glissez une tache ici"
- ScrollArea horizontal pour les 5 colonnes (avec ScrollBar visible)
- Auto-assignation a l'utilisateur courant si tache sans assignee draguee vers "done"
- **Statut:** OK
- **Fichiers:** `src/components/projects/kanban-board.tsx`
- **Modifie depuis v4** (les 5 colonnes sont maintenant fonctionnelles grace a la migration de statuts)

## Gamification

### Systeme XP
- 10 XP par tache completee (trigger `on_task_completed`)
- 50 XP par projet complete (trigger `on_project_completed`, distribue a tous les membres)
- XP retire si une tache/projet est remis dans un statut non-complete (undo)
- Colonnes `xp` et `level` dans la table `profiles`
- Fonction `add_xp()` en SQL (security definer)
- **Statut:** OK
- **Fichiers:** `supabase/migrations/20260331_gamification.sql`, `src/lib/gamification.ts`

### Systeme de niveaux
- Calcul dynamique du niveau a partir de l'XP via `calculate_level()` en SQL
- Progression exponentielle : chaque niveau necessite plus d'XP (level * 50 supplementaires)
- 7 titres : Debutant (1-2), Junior (3-4), Intermediaire (5-6), Confirme (7-9), Senior (10-14), Expert (15-19), Architecte (20+)
- Fonctions helpers TypeScript : `xpForLevel`, `xpForNextLevel`, `getLevelProgress`, `getLevelTitle`
- **Statut:** OK
- **Fichiers:** `src/lib/gamification.ts`

### Affichage XP
- Composant `XpBar` avec 2 modes : compact (header) et full (dashboard)
- Mode compact : badge "Niv. X" avec etoile + mini barre de progression + tooltip avec details
- Mode full : icone etoile, niveau, titre, barre de progression gradient, XP courant/requis
- Affiche dans le header (compact) et sur la page dashboard (full)
- **Statut:** OK
- **Fichiers:** `src/components/gamification/xp-bar.tsx`

### Mise a jour XP en temps reel
- Abonnement Supabase Realtime sur la table `profiles` (filtre par user ID) depuis le layout dashboard
- Toast "+X XP gagne !" affiche lors de chaque gain d'XP
- Le header (XpBar compact) se met a jour automatiquement sans rechargement de page
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/layout.tsx`

### Notification de niveau superieur
- Dialog `LevelUpDialog` : Trophy anime, etoiles Sparkles, titre du nouveau niveau, etoiles proportionnelles au niveau (max 5)
- Declenchement automatique lorsque le niveau augmente (detecte via comparaison avec `prevLevelRef`)
- **Statut:** OK
- **Fichiers:** `src/components/gamification/level-up-dialog.tsx`, `src/app/dashboard/layout.tsx`

### Badges
- 12 badges definis dans `src/lib/badges.ts` avec barres de progression sur les badges verrouilles :
  - Taches : Premier pas (1 tache), Productif (10 taches), Machine (50 taches)
  - Projets : Chef de projet (1 projet termine), Organisateur (3 projets crees)
  - Collaboration : Collaborateur (1 invitation), Recruteur (5 invitations)
  - Niveaux/XP : Confirme (niv. 5), Veteran (niv. 10), Marathonien (500 XP)
  - Streaks : Regulier (3 jours), Assidu (7 jours)
- Persistance en base via table `user_badges` avec date de debloquage
- Fonction SQL `sync_user_badges()` appelee au chargement du dashboard (synchro 5 badges cote SQL)
- Les 12 badges sont calcules cote TypeScript pour l'affichage, 5 sont persistes en base
- Composant `BadgesGrid` : grille de tuiles avec icone, nom, barre de progression, date de debloquage
- Badges non debloques : grise + filtre grayscale + barre de progression vers l'objectif
- Notification realtime : toast "Badge debloque : {nom} !" via abonnement Supabase sur `user_badges` INSERT
- **Statut:** OK (mais desynchro entre les 12 badges TS et les 5 persistes en SQL -- voir problemes)
- **Fichiers:** `src/lib/badges.ts`, `src/components/gamification/badges-grid.tsx`, `supabase/migrations/20260402_user_badges.sql`
- **Modifie depuis v4** (12 badges au lieu de 5, persistance DB, dates de debloquage, progress bars, notifications realtime)

### Classement global (Leaderboard)
- Page dediee `/dashboard/leaderboard`
- Composant `GlobalLeaderboard` : top 50 utilisateurs tries par XP decroissant
- Top 3 avec icones Trophy/Medal specifiques par rang et couleurs doree/argent/bronze
- Affiche : avatar, nom, niveau (badge), titre, XP total
- Mise en surbrillance de l'utilisateur connecte
- Lien dans la sidebar (icone Trophy)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/leaderboard/page.tsx`, `src/components/gamification/global-leaderboard.tsx`
- **Nouveau depuis v4** (etait une suggestion de v4)

### Classement d'equipe (Team Leaderboard)
- Composant `TeamLeaderboard` affiche dans la page detail d'un projet
- Membres tries par XP decroissant
- Top 3 avec icones Trophy/Medal specifiques par rang et couleurs doree/argent/bronze
- Affiche : avatar, nom, niveau (badge), barre de progression XP, titre, XP total
- **Statut:** OK
- **Fichiers:** `src/components/projects/team-leaderboard.tsx`, `src/components/projects/project-detail-client.tsx`

### Heatmap d'activite
- Composant `ActivityHeatmap` affiche sur le dashboard
- Grille style GitHub couvrant les 16 dernieres semaines
- 5 niveaux d'intensite (gris a vert)
- Labels jours (Lun, Mer, Ven) et mois
- Tooltips avec nombre d'actions par jour
- Legende d'intensite
- Donnees lues depuis la table `activity_log`
- **Statut:** En cours
- **Fichiers:** `src/components/gamification/activity-heatmap.tsx`, `src/app/dashboard/page.tsx`
- **Ce qui manque:** La table `activity_log` n'existe pas en base (aucune migration). Le composant s'affiche mais sans donnees. Il faut creer la table et un trigger pour logger les actions (taches, projets).
- **Nouveau depuis v4**

### Streaks (series de jours actifs)
- Affichage dans une carte stats sur le dashboard ("X jour(s)" + message contextuel)
- 2 badges streak definis (3 jours "Regulier", 7 jours "Assidu")
- Appel RPC `get_user_streak(p_user_id)` au chargement du dashboard
- **Statut:** En cours
- **Fichiers:** `src/app/dashboard/page.tsx`, `src/lib/badges.ts`
- **Ce qui manque:** La fonction SQL `get_user_streak()` n'existe pas en base (aucune migration). L'appel RPC echoue silencieusement (fallback a 0). Necessite la table `activity_log` + la fonction de calcul.
- **Modifie depuis v4** (UI ajoutee, mais toujours pas de backend)

## Profil et parametres

### Modification du profil
- Modification du nom complet (update table `profiles`)
- Modification de l'email (via `supabase.auth.updateUser()`)
- Feedback : alertes de succes et d'erreur
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`

### Avatar
- Upload d'image via Supabase Storage (bucket `avatars`)
- Chemin : `{userId}/avatar.{ext}` avec upsert
- URL publique avec cache-busting timestamp
- Formats acceptes : JPG, PNG, GIF (client-side). Description "2 Mo max" mais pas de validation de taille
- Apercu dans les parametres avec initiales en fallback
- Avatar affiche dans le header et les parametres
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/components/layout/header.tsx`
- **Nouveau depuis v4** (etait "Non implemente" en v4)

### Changement de mot de passe
- Formulaire dans les parametres : nouveau mot de passe + confirmation
- Validation : minimum 6 caracteres, correspondance des deux champs
- Via `supabase.auth.updateUser({ password })`
- Feedback : alertes succes/erreur dediees
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`
- **Nouveau depuis v4** (etait "Non implemente" en v4)

### Themes
- Mode clair / sombre / systeme via `next-themes`
- Toggle rapide dans le header (icone soleil/lune)
- 7 couleurs d'accent basiques dans les parametres : Defaut, Classique, Amethyste, Jade, Automne, Sakura, Poussin
- 1 theme avance : Charte graphique (palette officielle Challenge 48h)
- Persistence en localStorage
- Script anti-FOUC dans le head
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/lib/themes.ts`, `src/components/providers/color-theme-provider.tsx`, `src/components/providers/theme-provider.tsx`, `src/components/theme-toggle.tsx`

### Export de donnees
- Telechargement JSON contenant : profil, projets (avec taches imbriquees), date d'export
- Fichier nomme `mes-donnees.json`
- Bouton dans les parametres avec spinner de chargement
- Description correcte dans l'UI : "profil, projets, taches"
- Lien vers la politique de confidentialite
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/export/route.ts`
- **Modifie depuis v4** (export corrige : projets/taches au lieu de conversations/messages, description UI mise a jour)

### Suppression de compte
- Bouton dans la zone de danger (bordure rouge)
- Dialog de confirmation avec avertissement irreversible
- Suppression via admin client Supabase (`auth.admin.deleteUser`)
- Deconnexion et redirection vers `/login`
- Donnees en cascade supprimees grace aux FK `on delete cascade`
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/delete/route.ts`, `src/lib/supabase/admin.ts`

## Interface et UX

### Navigation
- Sidebar desktop collapsible (64px / 256px) avec 4 liens : Accueil, Projets, Classement, Parametres
- Sidebar mobile via Sheet (drawer) avec les memes 4 liens
- Header fixe (56px) avec : bouton menu (mobile), XpBar compact, toggle theme, menu dropdown utilisateur
- Menu dropdown : nom, Parametres, Deconnexion
- Liens legaux dans le footer de la sidebar : Confidentialite, Mentions legales
- Transitions fluides (300ms)
- **Statut:** OK
- **Fichiers:** `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-sidebar.tsx`, `src/components/layout/header.tsx`, `src/app/dashboard/layout.tsx`
- **Modifie depuis v4** (4 liens au lieu de 3, doublon "Profil" supprime du dropdown)

### Cookie consent
- Bandeau fixe en bas de page (z-50)
- Message : cookies d'authentification uniquement, pas de tracking
- Bouton "Compris" pour fermer
- Lien vers la politique de confidentialite
- Persistence en localStorage (`cookie-notice-dismissed`)
- **Statut:** OK
- **Fichiers:** `src/components/providers/cookie-consent.tsx`

### Responsive
- Layout adaptatif : sidebar desktop cachee sur mobile, sheet drawer
- Grilles responsives pour les projets (1 / 2 / 3 cols) et les stats (2 / 4 cols)
- Kanban en ScrollArea horizontal (min-width 800px) avec ScrollBar visible
- Landing page responsive (sm/md/lg breakpoints)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/layout.tsx`, `src/app/page.tsx`, pages et composants

### Toast notifications
- Sonner integre (position bottom-right, richColors)
- Utilise pour : creation de tache, erreurs kanban, erreurs suppression, gains d'XP, badges debloques
- Toast "+X XP gagne !" avec icone etoile lors de chaque gain
- Toast "Badge debloque : {nom} !" avec icone trophee
- **Statut:** OK
- **Fichiers:** `src/app/layout.tsx`, `src/app/dashboard/layout.tsx`, composants projets

### Composants UI (shadcn/ui)
- Alert, AlertDialog, Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, ScrollArea, Select, Separator, Sheet, Sonner (Toaster), Tabs, Textarea, Tooltip
- Total : 18 composants
- **Statut:** OK
- **Fichiers:** `src/components/ui/`

### Architecture des composants
- Composants organises en sous-dossiers par domaine :
  - `src/components/gamification/` : xp-bar, badges-grid, activity-heatmap, global-leaderboard, level-up-dialog
  - `src/components/layout/` : header, sidebar, mobile-sidebar
  - `src/components/providers/` : theme-provider, color-theme-provider, cookie-consent
  - `src/components/projects/` : kanban, cards, dialogs, leaderboard
  - `src/components/ui/` : primitives shadcn/ui
  - `src/components/theme-toggle.tsx` : standalone a la racine
- **Statut:** OK
- **Nouveau depuis v4** (reorganisation de l'archi composants)

## Pages legales

### Politique de confidentialite
- 9 sections : Responsable, Donnees collectees, Finalites, Destinataires (Supabase EU + Claude Desktop MCP local), Sous-traitants (table), Duree de conservation, Droits RGPD (5 droits), Cookies, Securite
- References a Claude Desktop via MCP au lieu de Mistral
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/privacy/page.tsx`
- **Modifie depuis v4** (Mistral supprime, Claude Desktop MCP ajoute)

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
| `/api/account/export` | GET | Oui (getUser) | Exporte profil + projets + taches en JSON | OK |

## Serveur MCP

### Tools (18 fichiers, 17 tools uniques + list_tools)

| Nom | Description | Statut |
|-----|-------------|--------|
| `list_tools` | Lister tous les outils disponibles (retourne 16 tools, manque get_user_gamification) | OK (incomplet) |
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
| `get_user_gamification` | Profil gamification : niveau, XP, titre, badges | OK |

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
- **Fichiers:** `mcp/server.ts`, `mcp/tools/` (18 fichiers), `mcp/resources/` (2 fichiers), `mcp/prompts/` (3 fichiers)

## Base de donnees

### Tables

| Table | Colonnes principales | RLS |
|-------|---------------------|-----|
| `profiles` | id (PK, FK auth.users), email, full_name, avatar_url, xp, level, created_at, updated_at | Oui (SELECT tous authentifies, INSERT/UPDATE/DELETE par owner) |
| `projects` | id (PK), name, description, status (planned/in_progress/completed), deadline, owner_id (FK), created_at, updated_at | Oui (SELECT owner+members, INSERT/UPDATE/DELETE owner) |
| `project_members` | project_id + user_id (PK composite), role (owner/member), joined_at | Oui (SELECT members, INSERT owner ou self-insert owner, DELETE owner) |
| `tasks` | id (PK), project_id (FK), title, description, status (backlog/todo/in_progress/review/done), assignee_id (FK, nullable), deadline, position, created_at, updated_at | Oui (SELECT/INSERT/UPDATE/DELETE par members) |
| `user_badges` | user_id (FK auth.users) + badge_id (PK composite), unlocked_at | Oui (SELECT tous authentifies, INSERT par owner) |
| `conversations` | id (PK), user_id (FK), title, created_at, updated_at | Oui (orpheline -- plus utilisee dans l'app) |
| `messages` | id (PK), conversation_id (FK), role, content, created_at | Oui (orpheline -- plus utilisee dans l'app) |

### Triggers et fonctions

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
| `sync_user_badges()` | RPC | Verifie et insere les badges debloques (5/12 badges geres) |

### Indexes
- `idx_project_members_user` sur project_members(user_id)
- `idx_tasks_project` sur tasks(project_id)
- `idx_tasks_assignee` sur tasks(assignee_id)
- `idx_tasks_status` sur tasks(status)

### Migrations
- `supabase/schema.sql` -- schema principal (inclut tables orphelines conversations/messages)
- `supabase/migrations/20260330_batch_update_task_positions.sql` -- RPC batch positions
- `supabase/migrations/20260331_gamification.sql` -- XP, niveaux, triggers
- `supabase/migrations/20260402_extend_task_status.sql` -- Ajout backlog/review au check constraint
- `supabase/migrations/20260402_user_badges.sql` -- Table user_badges, RLS, sync_user_badges()

---

## Evolution depuis v4

### Features ajoutees
- **Landing page** : page marketing complete sur `/` avec hero, features, highlights, CTA, footer
- **Leaderboard global** : page `/dashboard/leaderboard` avec top 50, icones de rang, mise en surbrillance de l'utilisateur courant
- **Heatmap d'activite** : composant affiche sur le dashboard (UI OK, backend manquant)
- **Avatar upload** : upload via Supabase Storage, apercu dans parametres et header
- **Changement de mot de passe** : formulaire dans les parametres avec validation
- **7 nouveaux badges** : Machine (50 taches), Organisateur (3 projets crees), Collaborateur (1 invite), Recruteur (5 invites), Marathonien (500 XP), Regulier (streak 3j), Assidu (streak 7j)
- **Persistance badges en DB** : table `user_badges` avec dates de debloquage
- **Barres de progression** sur les badges verrouilles (affichage courant/objectif)
- **Notification badge unlock** : toast realtime via subscription Supabase sur user_badges INSERT
- **Migration extend_task_status** : ajout de backlog et review au check constraint SQL
- **Reorganisation architecture** : composants reorganises en sous-dossiers (gamification/, layout/, providers/)

### Features completees (etaient "Non implemente" ou "En cours" en v4)
- Landing page publique -- maintenant OK (page marketing complete)
- Leaderboard global -- maintenant OK (etait une suggestion de v4)
- Avatar upload -- maintenant OK (Supabase Storage)
- Changement de mot de passe -- maintenant OK (formulaire dans parametres)
- Persistance badges en DB -- maintenant OK (table user_badges, dates de debloquage)

### Features corrigees
- **Incoherence statuts taches DB/UI (critique)** -- Corrigee via migration `20260402_extend_task_status.sql`. Le check constraint accepte maintenant les 5 statuts (backlog, todo, in_progress, review, done). Les 5 colonnes Kanban sont fonctionnelles.
- **Export de donnees obsolete** -- Corrige. L'endpoint exporte maintenant profil + projets + taches (plus de conversations/messages). Description UI mise a jour.
- **Doublon menu dropdown** -- Corrige. Seuls "Parametres" et "Deconnexion" restent (plus de doublon "Profil").

### Features supprimees / nettoyees
- **Dependances orphelines** -- react-markdown, remark-gfm, react-syntax-highlighter, @tailwindcss/typography supprimes de package.json
- **References Mistral** -- Toutes les references a Mistral et au chat IA supprimes du code actif (privacy, layout, CLAUDE.md)
- **Metadata obsolete** -- Title "Challenge 48h" remplace par "TaskFlow", description mise a jour

### Suggestions v4 implementees
- Corriger le check constraint des statuts taches (OK -- migration)
- Mettre a jour l'export de donnees (OK -- projets/taches au lieu de conversations)
- Nettoyer les dependances orphelines (OK -- supprimees)
- Changement de mot de passe dans les parametres (OK)
- Upload avatar (OK -- Supabase Storage)
- Landing page (OK -- page marketing complete)
- Persistance des badges en DB (OK -- table user_badges)
- Leaderboard global (OK -- page dediee)

### Suggestions v4 non implementees
- Supprimer les tables orphelines conversations/messages (toujours dans schema.sql)
- Streaks (UI affichee mais backend SQL absent)

---

## Problemes detectes

1. **Tables orphelines en base (mineur)** -- Les tables `conversations` et `messages` sont toujours dans `schema.sql`. Aucun code actif ne les utilise. Elles devraient etre supprimees via une migration de nettoyage.

2. **Desynchro badges SQL/TypeScript (modere)** -- Le TypeScript definit 12 badges (`src/lib/badges.ts`) mais la fonction SQL `sync_user_badges()` n'en persiste que 5 (first_task, ten_tasks, first_project, level_5, level_10). Les 7 autres badges (fifty_tasks, three_projects_created, first_invite, five_invites, xp_500, streak_3, streak_7) ne sont jamais inseres dans `user_badges`, donc pas de date de debloquage ni de notification realtime pour eux.

3. **Table `activity_log` manquante (modere)** -- Le dashboard tente de lire depuis `activity_log` pour le heatmap, mais cette table n'existe pas. Le composant s'affiche sans donnees. Il faut creer la table et des triggers pour logger les actions.

4. **Fonction `get_user_streak()` manquante (modere)** -- Le dashboard appelle `get_user_streak(p_user_id)` via RPC mais cette fonction n'existe pas. Le streak est toujours a 0. Les badges streak ne se debloqueront jamais tant que cette fonction et l'activity_log n'existent pas.

5. **`list_tools` MCP incomplet (mineur)** -- Le tool `list_tools` retourne 16 tools mais n'inclut pas `get_user_gamification`. Un utilisateur MCP ne decouvrira pas ce tool via l'auto-description.

6. **Pas de validation taille avatar (mineur)** -- L'UI indique "2 Mo max" mais aucune validation cote client ou serveur. Les gros fichiers seront uploades jusqu'a la limite de Supabase Storage.

---

## Suggestions pour FEATURE-v6

1. **Creer la table `activity_log` et les triggers** -- Migration avec table `activity_log(id, user_id, activity_date, action_type)` + triggers sur task completion, project completion, creation de tache. Impact : heatmap fonctionnel, streaks fonctionnels.

2. **Implementer `get_user_streak()`** -- Fonction SQL calculant les jours consecutifs d'activite a partir d'`activity_log`. Impact : carte streak et badges streak fonctionnels.

3. **Synchroniser les 12 badges dans `sync_user_badges()`** -- Mettre a jour la fonction SQL pour gerer les 12 badges au lieu de 5. Ajouter les conditions pour fifty_tasks, three_projects_created, first_invite, five_invites, xp_500, streak_3, streak_7. Impact : persistence et notifications realtime pour tous les badges.

4. **Supprimer les tables orphelines** -- Migration de suppression des tables `conversations` et `messages`. Impact : coherence du schema.

5. **Ajouter `get_user_gamification` dans `list_tools`** -- Ajouter l'entree manquante dans la liste retournee par le tool MCP. Impact : decouverte complete des tools.

6. **Validation taille avatar** -- Ajouter une verification client-side de la taille du fichier (< 2 Mo) avant upload. Impact : UX.

7. **XP bonus pour gamification etendue** -- +5 XP par tache creee, +15 XP par invitation de membre (mentionnes dans CLAUDE.md mais non implementes dans les triggers SQL). Impact : engagement accru.

8. **Edition inline des taches** -- Modifier titre/description/deadline directement depuis le kanban sans ouvrir un dialog. Impact : productivite.

9. **Edition des details projet** -- Modifier nom/description/deadline d'un projet existant depuis la page detail. Impact : UX basique attendu.

10. **Confirmation email** -- Ajouter un flux de verification email a l'inscription. Impact : securite.
