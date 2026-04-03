# FEATURE-v2 -- Etat des features actuelles

Date: 2026-03-28
Version precedente: v1

## Authentification

### Inscription
- Formulaire email + mot de passe + nom complet
- Case de consentement obligatoire avant soumission
- Validation client : mot de passe minimum 6 caracteres, tous les champs requis
- Creation automatique du profil via trigger Supabase (`handle_new_user()`)
- Redirection vers `/dashboard` apres inscription
- **Statut:** OK
- **Fichiers:** `src/app/(auth)/register/page.tsx`, `supabase/schema.sql`

### Confirmation email
- Aucun flux de verification email implemente
- L'utilisateur accede immediatement au dashboard sans confirmer son email
- **Statut:** Non implemente
- **Fichiers:** --

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
- Formulaire de saisie d'email
- Envoi d'un email de reinitialisation via `supabase.auth.resetPasswordForEmail()`
- URL de redirection : `${window.location.origin}/login`
- Page de reinitialisation du mot de passe (formulaire avec nouveau mot de passe) inexistante
- Pas de route `/auth/callback` pour gerer le token de reset
- **Statut:** En cours
- **Fichiers:** `src/app/(auth)/forgot-password/page.tsx`
- Il manque : une page dediee pour saisir le nouveau mot de passe et une route callback pour traiter le token

### Deconnexion
- Bouton dans le menu dropdown du header
- Appelle `supabase.auth.signOut()` puis redirige vers `/login`
- `router.refresh()` pour nettoyer le cache
- **Statut:** OK
- **Fichiers:** `src/components/header.tsx`

## Dashboard

### Page d'accueil
- Message de bienvenue avec le prenom de l'utilisateur
- Statistiques : nombre de conversations, nombre de prompts sauvegardes
- 4 cartes d'actions rapides : Conversations, Nouveau chat, Mes prompts, Parametres
- Chargement server-side via `Promise.all`
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/page.tsx`
- **Nouveau depuis v1** (stat prompts ajoutee)

## Chat

### Gestion des conversations
- Creation d'une nouvelle conversation (bouton + ou automatique au premier message)
- Liste des conversations dans un panneau lateral (Card, masque sur mobile)
- Titre auto-genere a partir des 50 premiers caracteres du premier message
- Selection d'une conversation pour charger ses messages
- Suppression d'une conversation (icone poubelle au hover, sans confirmation)
- Limite a 30 conversations chargees (pas de pagination)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/chat/page.tsx`

### Messagerie
- Envoi de messages texte
- Sauvegarde du message utilisateur en base avant l'appel API
- Reponses en streaming (SSE) depuis l'API
- Historique persiste dans Supabase (table `messages`)
- Contexte de conversation envoye avec chaque requete (truncation automatique)
- Support multi-lignes (Shift+Enter pour saut de ligne, Enter pour envoyer)
- Message d'erreur affiche dans le chat en cas d'echec
- Filtrage des messages assistant vides en cas d'erreur
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/chat/page.tsx`, `src/lib/ai/truncate.ts`

### Selection de modeles / Modes de chat
- 2 modes : Rapide (Mistral Small, 32K) et Precis (Mistral Large, 128K)
- Toggle via 2 boutons avec icones (Zap / Target)
- Tooltip avec description du mode
- Desactive pendant le chargement
- 7 modeles definis en backend mais non exposes dans l'UI : Mistral Small, Mistral Medium, Mistral Large, Codestral, Pixtral, Llama 3.3 70B (OpenRouter), Nemotron 2 Super (OpenRouter)
- Le mode envoie `selectedMode.modelId` a l'API qui resout le modele complet
- **Statut:** OK
- **Fichiers:** `src/components/model-selector.tsx`, `src/lib/ai/models.ts`

### Rendu des messages
- Markdown complet via `react-markdown` + `remark-gfm` (GFM : tableaux, listes, gras, italique, barrer, titres, citations)
- Blocs de code avec coloration syntaxique via `react-syntax-highlighter` (Prism)
- Theme de code adaptatif : oneDark (sombre), oneLight (clair)
- Bouton copier sur les blocs de code avec feedback visuel (checkmark 2s)
- Label de langage affiche en haut du bloc de code
- Liens ouverts dans un nouvel onglet (`target="_blank"`, `rel="noopener noreferrer"`)
- Messages utilisateur en texte brut avec `whitespace-pre-wrap`
- **Statut:** OK
- **Fichiers:** `src/components/chat-message.tsx`, `src/components/code-block.tsx`
- **Nouveau depuis v1** (rendu markdown etait une suggestion v1)

### Truncation du contexte
- Estimation de tokens : `text.length / 3.5`
- Budget : 70% de la fenetre de contexte du modele
- Garde toujours le message systeme et le dernier message
- Remplit le reste depuis les messages les plus recents
- **Statut:** OK
- **Fichiers:** `src/lib/ai/truncate.ts`

## Prompts

### CRUD prompts
- Creation via dialog : titre, contenu, categorie
- 6 categories predefinies : General, Redaction, Code, Traduction, Analyse, Creative
- Modification via dialog pre-rempli
- Suppression directe (pas de confirmation)
- Copie du contenu dans le presse-papier avec feedback visuel
- 4 prompts par defaut disponibles : Resume ce texte, Traduis en anglais, Explique simplement, Revue de code
- Bouton "Ajouter les prompts par defaut" quand la liste est vide
- Filtrage par categorie via badges
- Grille responsive (1 / 2 / 3 colonnes)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/prompts/page.tsx`
- **Nouveau depuis v1** (feature entierement nouvelle)

### Insertion de prompts dans le chat
- Bouton "Prompts" dans la zone de saisie du chat
- Dialog modal avec liste des prompts sauvegardes
- Filtrage par categorie dans le picker
- Clic sur un prompt insere son contenu dans le textarea
- Chargement des prompts a l'ouverture du dialog
- **Statut:** OK
- **Fichiers:** `src/components/prompt-picker.tsx`
- **Nouveau depuis v1**

## Profil et parametres

### Modification du profil
- Modification du nom complet (update table `profiles`)
- Modification de l'email (via `supabase.auth.updateUser()`)
- Feedback : alertes de succes et d'erreur
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`

### Avatar
- Champ `avatar_url` present en base (table `profiles`)
- Initiales affichees dans le header (composant Avatar)
- Aucun upload ni affichage d'image
- **Statut:** Non implemente
- **Fichiers:** `src/types/database.ts`, `src/components/header.tsx`

### Themes
- Mode clair / sombre / systeme via `next-themes`
- Toggle rapide dans le header (icone soleil/lune avec animation de rotation)
- 7 couleurs d'accent : Defaut (neutre), Classique (bleu), Amethyste (violet), Jade (vert), Automne (orange), Sakura (rose), Poussin (jaune)
- Chaque theme definit des variables CSS pour les modes clair et sombre
- Persistence en localStorage
- Script d'hydratation pour eviter le flash de contenu non-style (FOUC)
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/lib/themes.ts`, `src/components/color-theme-provider.tsx`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/app/globals.css`
- **Nouveau depuis v1** (couleurs d'accent ajoutees)

### Export de donnees
- Telechargement JSON contenant : profil, conversations, messages, date d'export
- Fichier nomme `mes-donnees.json`
- Bouton dans les parametres avec spinner de chargement
- Lien vers la politique de confidentialite a cote
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/export/route.ts`
- **Nouveau depuis v1**

### Suppression de compte
- Bouton dans la zone de danger (bordure rouge)
- Dialog de confirmation avec avertissement irreversible
- Suppression via admin client Supabase (`auth.admin.deleteUser`)
- Deconnexion et redirection vers `/login` apres suppression
- Donnees en cascade supprimees grace aux FK `on delete cascade`
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/delete/route.ts`, `src/lib/supabase/admin.ts`

### Changement de mot de passe
- Aucune interface dans les parametres
- **Statut:** Non implemente

## Interface et UX

### Navigation
- Sidebar desktop collapsible (64px / 256px) avec 4 liens : Accueil, Chat, Mes prompts, Parametres
- Sidebar mobile via Sheet (drawer) avec les memes liens
- Header fixe (56px) avec : bouton menu (mobile), toggle theme, menu dropdown utilisateur
- Menu dropdown : nom de l'utilisateur, Parametres, Profil (doublon avec Parametres), Deconnexion
- Liens legaux dans le footer de la sidebar : Confidentialite, Mentions legales
- Transitions fluides (300ms)
- **Statut:** OK
- **Fichiers:** `src/components/sidebar.tsx`, `src/components/mobile-sidebar.tsx`, `src/components/header.tsx`, `src/app/dashboard/layout.tsx`

### Cookie consent
- Bandeau fixe en bas de page (z-50)
- Message : utilise uniquement des cookies d'authentification, pas de tracking
- Bouton "Compris" pour fermer
- Lien vers la politique de confidentialite
- Stockage du choix en `localStorage` (`cookie-notice-dismissed`)
- Se cache si deja accepte
- **Statut:** OK
- **Fichiers:** `src/components/cookie-consent.tsx`

### Responsive
- Layout adaptatif : sidebar desktop cachee sur mobile, sheet drawer a la place
- Grille dashboard : 1 col (mobile) / 2 cols (md) / 4 cols (lg)
- Grille prompts : 1 col / 2 cols / 3 cols
- Grille themes : 4 cols / 7 cols
- Panneau conversations du chat cache sur mobile (md:flex)
- Padding et max-width adaptes par page
- **Statut:** OK
- **Fichiers:** `src/app/dashboard/layout.tsx`, `src/app/dashboard/chat/page.tsx`, `src/app/dashboard/settings/page.tsx`

### Composants UI (shadcn/ui)
- Alert, Avatar, Badge, Button (6 variants, 4 tailles), Card, Dialog, DropdownMenu, Input, Label, ScrollArea, Separator, Sheet, Tabs, Textarea
- Total : 14 composants
- **Statut:** OK
- **Fichiers:** `src/components/ui/`

### Page d'accueil publique
- Pas de landing page : `/` redirige vers `/dashboard` (connecte) ou `/login` (non connecte)
- **Statut:** Non implemente
- **Fichiers:** `src/app/page.tsx`

## Pages legales

### Politique de confidentialite
- 9 sections : Responsable, Donnees collectees, Finalites, Destinataires, Sous-traitants (tableau), Duree de conservation, Droits RGPD (acces, rectification, effacement, portabilite, opposition), Cookies, Securite
- Mention du plan gratuit Mistral et de l'utilisation des donnees pour l'entrainement
- Contact : contact@challenge48h.fr
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/privacy/page.tsx`
- **Nouveau depuis v1** (etait une suggestion v1)

### Mentions legales
- 4 sections : Editeur, Hebergement (Vercel + Supabase Frankfurt), Propriete intellectuelle, Donnees personnelles (lien vers privacy)
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/mentions-legales/page.tsx`
- **Nouveau depuis v1**

### Layout legal
- Container centre max-w-3xl avec bouton retour
- **Statut:** OK
- **Fichiers:** `src/app/(legal)/layout.tsx`

## API Routes

| Route | Methode | Auth | Description | Statut |
|-------|---------|------|-------------|--------|
| `/api/chat` | POST | Oui (session) | Envoie les messages au modele selectionne (Mistral ou OpenRouter), retourne un flux SSE | OK |
| `/api/account/delete` | DELETE | Oui (session) | Supprime le compte utilisateur via admin client, cascade sur toutes les donnees | OK |
| `/api/account/export` | GET | Oui (session) | Exporte profil + conversations + messages en JSON telechareable | OK |

## Base de donnees

### Tables

| Table | Colonnes | RLS |
|-------|----------|-----|
| `profiles` | id (uuid, PK, FK auth.users), email (text), full_name (text), avatar_url (text), created_at, updated_at | Oui (SELECT/INSERT/UPDATE/DELETE par owner) |
| `conversations` | id (uuid, PK), user_id (uuid, FK auth.users), title (text), created_at, updated_at | Oui (SELECT/INSERT/UPDATE/DELETE par owner) |
| `messages` | id (uuid, PK), conversation_id (uuid, FK conversations), role (text, check user/assistant), content (text), created_at | Oui (SELECT/INSERT via subquery sur conversations.user_id) |
| `prompts` | id, user_id, title, content, category, created_at, updated_at (reference dans le code et les types) | Supposee (non definie dans schema.sql) |

**Note :** La table `prompts` est utilisee dans le code (`dashboard/page.tsx`, `dashboard/prompts/page.tsx`, `prompt-picker.tsx`) et definie dans les types (`types/database.ts`), mais elle n'est **pas presente dans `supabase/schema.sql`**. Elle a probablement ete creee manuellement ou via un autre mecanisme.

### Triggers et fonctions

| Nom | Declencheur | Action |
|-----|-------------|--------|
| `handle_new_user()` | AFTER INSERT sur `auth.users` | Cree un profil dans `profiles` avec id, email, full_name |
| `update_updated_at()` | BEFORE UPDATE sur `profiles`, `conversations` | Met a jour le champ `updated_at` a `now()` |
| `on_auth_user_created` | Trigger sur `auth.users` | Appelle `handle_new_user()` |
| `profiles_updated_at` | Trigger sur `profiles` | Appelle `update_updated_at()` |
| `conversations_updated_at` | Trigger sur `conversations` | Appelle `update_updated_at()` |

### Migrations
- Pas de systeme de migrations : un seul fichier `supabase/schema.sql`
- Aucun fichier dans `supabase/migrations/`

### Region
- Frankfurt (eu-central-1) pour conformite RGPD

---

## Evolution depuis v1

### Features ajoutees
- Page de gestion des prompts (CRUD complet, categories, prompts par defaut)
- Insertion de prompts dans le chat (prompt picker)
- Rendu markdown des reponses (react-markdown + remark-gfm)
- Coloration syntaxique des blocs de code (react-syntax-highlighter)
- Bouton copier sur les blocs de code
- Politique de confidentialite (page complete, 9 sections)
- Mentions legales
- Layout dedie aux pages legales
- Export de donnees utilisateur (JSON)
- Couleurs d'accent (7 themes)
- Script anti-FOUC pour le theme couleur
- Stat du nombre de prompts sur le dashboard
- Support multi-provider (OpenRouter en plus de Mistral)
- 7 modeles definis (5 Mistral + 2 OpenRouter)
- Truncation intelligente du contexte de conversation

### Features completees (etaient "en cours")
- Protection de l'API chat par session serveur (v1 signalait "accessible sans auth") -- desormais verifie via `session?.user`
- Suppression reelle du compte `auth.users` via admin client (v1 signalait "pas encore implementee")

### Features supprimees
- Aucune

### Suggestions v1 implementees
- Rendu markdown des reponses (OK)
- Page politique de confidentialite (OK)
- Export de conversation -- implemente sous forme d'export global de donnees (JSON)

### Suggestions v1 non implementees
- Recherche dans les conversations
- Renommage manuel d'une conversation
- Export de conversation individuelle (txt/pdf)
- Upload et affichage d'avatar
- Changement de mot de passe depuis les parametres
- Toast notifications
- Landing page publique sur `/`
- Rate limiting sur l'API chat

---

## Suggestions pour FEATURE-v3

1. **Page de reset mot de passe** -- Completer le flux forgot-password avec une page dediee et une route callback. Impact fort : feature d'auth critique incomplete.
2. **Table prompts dans schema.sql** -- Ajouter la definition SQL de la table `prompts` avec RLS dans le schema pour coherence et reproductibilite.
3. **Changement de mot de passe** -- Ajouter un formulaire dans les parametres. Impact moyen : attendu par les utilisateurs.
4. **Recherche dans les conversations** -- Filtre par titre dans la sidebar du chat. Impact moyen : navigation difficile au-dela de 10 conversations.
5. **Renommage manuel des conversations** -- Permettre de modifier le titre depuis la sidebar. Impact faible-moyen : amelioration UX simple.
6. **Pagination des conversations** -- Remplacer la limite de 30 par un scroll infini ou pagination. Impact moyen a terme.
7. **Rate limiting sur l'API chat** -- Proteger contre l'abus. Impact securite.
8. **Landing page publique** -- Page marketing sur `/` au lieu d'une redirection. Impact acquisition.
9. **Upload avatar** -- Utiliser Supabase Storage pour l'upload et l'affichage. Impact faible : champ deja en base.
10. **Toast notifications** -- Remplacer les alertes inline par des toasts pour un feedback plus fluide. Impact UX.
