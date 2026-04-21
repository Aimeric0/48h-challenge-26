# FEATURE-v1 — Etat des features actuelles

Date: 2026-03-28

## Authentification

### Inscription
- Formulaire email + mot de passe + nom complet
- Creation automatique du profil via trigger Supabase
- Redirection vers le dashboard apres inscription
- **En cours:** gestion du cas "confirmation email requise" (pas encore implementee)

### Connexion
- Formulaire email + mot de passe
- Redirection vers le dashboard
- Protection des routes `/dashboard/*` via middleware Supabase SSR

### Mot de passe oublie
- Envoi d'un email de reinitialisation via Supabase
- **En cours:** page dediee de reset password (le lien renvoie vers `/login` pour l'instant)

### Deconnexion
- Via le menu utilisateur dans le header

## Dashboard

### Page d'accueil
- Message de bienvenue avec le prenom de l'utilisateur
- Statistique: nombre de conversations
- Cartes d'actions rapides: nouveau chat, voir les conversations, parametres

## Chat IA (Mistral)

### Conversations
- Creation d'une nouvelle conversation
- Liste des conversations dans une sidebar dediee
- Selection d'une conversation pour afficher ses messages
- Suppression d'une conversation
- Titre auto-genere a partir du premier message de l'utilisateur

### Messagerie
- Envoi de messages texte
- Reponses en streaming depuis l'API Mistral (`mistral-small-latest`)
- Historique persiste dans Supabase (table `messages`)
- Support multi-lignes (Shift+Enter)
- System prompt: assistant francophone, clair et concis

### API
- Route POST `/api/chat` avec streaming SSE
- **En cours:** protection par session serveur (actuellement accessible sans auth)

## Profil et parametres

### Gestion du profil
- Modification du nom complet
- Modification de l'email
- Champ `avatar_url` present en base mais pas encore exploite

### Suppression de compte
- Bouton avec dialog de confirmation
- Supprime le profil applicatif et deconnecte
- **En cours:** suppression reelle du compte `auth.users` (pas encore implementee)

## Interface et UX

### Theme
- Mode clair / mode sombre via `next-themes`
- Toggle dans le header

### Navigation
- Sidebar collapsible (desktop)
- Sidebar mobile via sheet
- Header avec menu utilisateur (dropdown)

### Composants UI
- Tous bases sur shadcn/ui et Radix
- Button, Card, Input, Label, Dialog, DropdownMenu, ScrollArea, Separator, Sheet, Tabs, Textarea, Avatar, Badge, Alert

### Cookie consent
- Bandeau de consentement aux cookies essentiels
- Stockage du choix en localStorage

### Responsive
- Layout adaptatif desktop/mobile
- Sidebar mobile dediee

## Base de donnees (Supabase)

### Tables
- `profiles` — id, email, full_name, avatar_url, created_at, updated_at
- `conversations` — id, user_id, title, created_at, updated_at
- `messages` — id, conversation_id, role (user/assistant), content, created_at

### Securite
- RLS active sur toutes les tables
- Policies: chaque utilisateur accede uniquement a ses propres donnees
- Triggers: updated_at automatique, creation profil a l'inscription

### Region
- Frankfurt (eu-central-1) pour conformite RGPD

---

## Suggestions pour FEATURE-v2

- Recherche dans les conversations (filtre par titre ou contenu)
- Renommage manuel d'une conversation
- Export de conversation (txt/pdf)
- Rendu markdown des reponses IA (code, listes, gras)
- Upload et affichage d'avatar utilisateur (Supabase Storage)
- Changement de mot de passe depuis les parametres
- Toast notifications (feedback actions)
- Landing page publique sur `/`
- Rate limiting sur l'API chat
- Page politique de confidentialite
