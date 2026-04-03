# Challenge 48h — Gestion de Projet × MCP

Application web de gestion de projet pensee par et pour les etudiants en informatique, couplee a un serveur MCP (Model Context Protocol) permettant de piloter l'app en langage naturel via un assistant IA.

**Vision :** rendre la gestion de projet tellement fluide et integree dans le workflow quotidien que les etudiants la maintiennent naturellement, sans effort supplementaire.

## Stack technique

| Categorie | Technologie | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | ^16.2.1 |
| **Langage** | TypeScript (strict) | ^5 |
| **UI** | React | ^18 |
| **Styling** | Tailwind CSS | ^3.4.1 |
| **Composants** | shadcn/ui + Radix UI | — |
| **Icones** | Lucide React | ^1.6.0 |
| **Theme** | next-themes (dark/light) | ^0.4.6 |
| **Auth & BDD** | Supabase (SSR, RLS) | ^2.100.0 |
| **MCP** | @modelcontextprotocol/sdk | — |
| **Drag & Drop** | dnd-kit | — |

## Fonctionnalites

### Application Web

- **Authentification** — Inscription / connexion par email + mot de passe, gestion de profil, mot de passe oublie
- **Gestion de projets** — CRUD complet, invitation de membres par email, statuts (planifie / en cours / termine)
- **Gestion de taches** — CRUD complet, assignation a un membre, statuts (To Do / In Progress / Done), deadlines avec detection de retard
- **Board Kanban** — Tableau visuel avec drag & drop (dnd-kit), reordonancement des taches, deplacement entre colonnes
- **Dashboard** — Vue d'ensemble des projets, progression, taches en retard, statistiques
- **Gamification** — Systeme d'XP (10 XP/tache, 50 XP/projet), niveaux avec titres (Debutant → Expert), barre de progression dans le header
- **Parametres** — Modification du profil, suppression de compte, export des donnees (RGPD)
- **Dark mode** — Theme clair/sombre avec basculement automatique

### Serveur MCP

Le serveur expose **15 tools**, **1 resource** et **3 prompts** pour permettre a un assistant IA de piloter l'application.

#### Tools

| Nom | Description |
|---|---|
| `list_projects` | Lister les projets de l'utilisateur |
| `create_project` | Creer un projet (nom, description, deadline) |
| `list_tasks` | Lister les taches d'un projet (filtres : statut, assignation) |
| `create_task` | Creer une tache avec titre, description, assignation |
| `update_task` | Modifier statut, assignation ou deadline |
| `delete_task` | Supprimer une tache par ID |
| `assign_task` | Assigner ou reassigner une tache a un membre |
| `get_project_summary` | Resume structure (stats + taches critiques) |
| `get_project_stats` | Taux de completion, velocite hebdomadaire |
| `list_members` | Lister les membres d'un projet avec roles |
| `invite_member` | Inviter un utilisateur par email |
| `get_overdue_tasks` | Recuperer les taches en retard |
| `get_user_tasks` | Taches assignees a un utilisateur |
| `get_user_by_email` | Rechercher un utilisateur par email |
| `get_current_user` | Obtenir les infos de l'utilisateur connecte |

#### Resources & Prompts

| Type | Nom | Description |
|---|---|---|
| Resource | `project://<id>` | Donnees completes du projet (snapshot JSON) |
| Prompt | `standup` | Template de daily standup avec contexte projet |
| Prompt | `retrospective` | Template de retrospective sprint |
| Prompt | `task_breakdown` | Decomposition d'un objectif en sous-taches |

> Documentation complete des outils MCP : [`docs/doc/MCP_TOOLS.md`](docs/doc/MCP_TOOLS.md)

## Prerequisites

- Node.js 18+
- Un projet [Supabase](https://supabase.com) (region Frankfurt pour le RGPD)

## Installation

```bash
git clone https://github.com/Aimeric0/48h-challenge-26.git
cd 48h-challenge-26
npm install
```

Copier le fichier d'environnement et remplir les cles :

```bash
cp .env.local.example .env.local
```

Variables requises dans `.env.local` :

```
# Supabase — App Web
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MCP Server — compte de service utilise par le serveur MCP pour s'authentifier
MCP_USER_EMAIL=mcp@example.com
MCP_USER_PASSWORD=your-mcp-password
```

| Variable | Ou la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Dashboard Supabase → Settings → API → Project API keys (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Settings → API → Project API keys (service_role) |
| `MCP_USER_EMAIL` | Email d'un compte Supabase dedie au serveur MCP |
| `MCP_USER_PASSWORD` | Mot de passe de ce compte |

### Base de donnees

Executer le schema SQL dans l'editeur SQL du dashboard Supabase :

```
supabase/schema.sql
```

Puis appliquer les migrations dans `supabase/migrations/` pour la gamification.

## Lancer en local

```bash
npm run dev
```

L'app tourne sur [http://localhost:3000](http://localhost:3000).

## Configuration MCP (Claude Desktop)

Le serveur MCP demarre automatiquement via Claude Desktop.

### Chemin du fichier de config

| OS | Chemin |
|---|---|
| **Windows** | `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |

### Contenu a ajouter

```json
{
  "mcpServers": {
    "challenge48h": {
      "command": "cmd",
      "args": [
        "/c", "npx", "tsx",
        "/chemin/vers/48h-challenge-26/mcp/server.ts"
      ],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "<votre_supabase_url>",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY": "<votre_publishable_key>",
        "MCP_USER_EMAIL": "<email_compte_mcp>",
        "MCP_USER_PASSWORD": "<mot_de_passe_compte_mcp>"
      }
    }
  }
}
```

> Sur macOS, remplacer `"command": "cmd"` et `"args": ["/c", "npx", "tsx", ...]` par `"command": "npx"` et `"args": ["tsx", "..."]`.

Redemarrer Claude Desktop — le serveur s'initialise et les tools sont disponibles dans le chat.

## Structure du projet

```
mcp/                    # Serveur MCP standalone (stdio)
├── tools/              # 15 tools (CRUD projets, taches, membres, stats)
├── resources/          # Resource project://<id>
├── prompts/            # Prompts (standup, retrospective, task_breakdown)
├── lib/                # Client Supabase pour le serveur MCP
└── server.ts           # Point d'entree du serveur
docs/
├── doc/                # Documentation MCP
├── features/           # Historique des versions
├── audit/              # Audits
├── perf/               # Performances
├── rgpd/               # Conformite RGPD
└── powerpoint/         # Presentations
src/
├── app/
│   ├── (auth)/         # Pages auth (login, register, forgot-password)
│   ├── (legal)/        # Pages legales (CGU, confidentialite)
│   ├── api/            # Route handlers (account delete/export)
│   └── dashboard/      # Pages protegees (projets, kanban, settings)
├── components/
│   ├── ui/             # Primitives shadcn/ui
│   ├── projects/       # Composants projet (kanban, cards, dialogs)
│   ├── gamification/   # XP bar, badges, leaderboard, heatmap
│   ├── layout/         # Header, sidebar, mobile sidebar
│   └── providers/      # Theme, cookie consent
├── lib/
│   ├── supabase/       # Client Supabase (auth, projets, taches)
│   └── gamification.ts # Calculs XP et niveaux
└── types/              # Types TypeScript
supabase/
├── schema.sql          # Schema de base de donnees
└── migrations/         # Migrations (gamification, etc.)
```

## Equipe

| Membre | Role |
|---|---|
| **Nathan** (Techlead) | Backend, integration IA (MCP), Supabase |
| **Tyfenn** | Backend, tests |
| **Aimeric** | Frontend, tests |
| **Enzo** | Frontend, UX/UI |

## Build production

```bash
npm run build
npm start
```

## Ressources

- [Documentation MCP](https://modelcontextprotocol.io)
- [SDK TypeScript MCP](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Supabase](https://supabase.com/docs)
