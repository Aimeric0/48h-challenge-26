# Challenge 48h — Gestion de Projet × MCP

Application web de gestion de projet pensée par et pour les étudiants en informatique, couplée à un serveur MCP (Model Context Protocol) permettant de piloter l'app en langage naturel via un assistant Mistral.

**Vision :** rendre la gestion de projet tellement fluide et intégrée dans le workflow quotidien que les étudiants la maintiennent naturellement, sans effort supplémentaire.

## Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | ^16.2.1 |
| **Langage** | TypeScript (strict) | ^5 |
| **UI** | React | ^18 |
| **Styling** | Tailwind CSS | ^3.4.1 |
| **Composants** | shadcn/ui + Radix UI | — |
| **Icônes** | Lucide React | ^1.6.0 |
| **Thème** | next-themes (dark/light) | ^0.4.6 |
| **Auth & BDD** | Supabase (SSR, RLS) | ^2.100.0 |
| **Assistant** | Mistral (client MCP) | — |
| **MCP** | @modelcontextprotocol/sdk | — |
| **Markdown** | react-markdown + remark-gfm | ^10.1.0 |
| **Coloration syntaxique** | react-syntax-highlighter | ^16.1.1 |

## Fonctionnalités

### Socle — App Web
- **Authentification** — Inscription / connexion (email + mot de passe), profil utilisateur
- **Gestion de projets** — Créer un projet, inviter des membres
- **Gestion de tâches** — CRUD complet, assignation, statuts (To Do / In Progress / Done), deadlines
- **Board visuel** — Tableau Kanban
- **Dashboard projet** — Progression globale, tâches en retard, activité récente

### Serveur MCP

#### Tools — Socle

| Primitive | Nom | Description |
|---|---|---|
| Tool | `list_projects` | Lister les projets de l'utilisateur |
| Tool | `list_tasks` | Lister les tâches d'un projet (filtres : statut, assignation, deadline) |
| Tool | `create_task` | Créer une tâche (titre, description, assignation) |
| Tool | `update_task` | Modifier statut, assignation ou deadline |
| Tool | `get_project_summary` | Résumé structuré de l'état du projet (stats + tâches critiques) |

#### Tools — Avancés

| Primitive | Nom | Description |
|---|---|---|
| Tool | `create_project` | Créer un projet (nom, description, deadline) et ajouter le propriétaire |
| Tool | `delete_task` | Supprimer une tâche par ID |
| Tool | `assign_task` | Assigner ou réassigner une tâche à un membre |
| Tool | `list_members` | Lister les membres d'un projet avec profils et rôles |
| Tool | `invite_member` | Inviter un utilisateur par email dans un projet |
| Tool | `get_overdue_tasks` | Récupérer les tâches en retard (tous projets ou par projet) |
| Tool | `get_user_tasks` | Lister les tâches assignées à un utilisateur |
| Tool | `get_project_stats` | Statistiques : taux de complétion, vélocité hebdomadaire |

#### Resources & Prompts

| Primitive | Nom | Description |
|---|---|---|
| Resource | `project://<id>` | Données complètes du projet (snapshot JSON) |
| Prompt | `standup` | Template de daily standup avec contexte projet |
| Prompt | `retrospective` | Template de rétrospective sprint |
| Prompt | `task_breakdown` | Décomposition d'un objectif en sous-tâches |

> Documentation complète des outils MCP : [`doc/MCP_TOOLS.md`](doc/MCP_TOOLS.md)

### Fonctionnalités avancées
- **Gamification** — XP, badges, streaks (séries de jours actifs), classement d'équipe
- **Notifications intelligentes** — Deadline dans 24h, tâche bloquée depuis 3 jours, membre inactif (email, push, ou in-app)

### Fonctionnalités bonus
- **Intégration Git** — Lier commits/branches/PRs aux tâches, auto-done sur PR mergée (webhook GitHub/GitLab)
- **Timeline / Gantt simplifié** — Vue temporelle avec dépendances
- **Rétrospective intégrée** — What went well / What to improve
- **MCP avancé** — Standup auto, détection risques de retard, suggestion répartition de tâches

## Prérequis

- Node.js 18+
- Un projet [Supabase](https://supabase.com) (région Frankfurt pour le RGPD)
- Une clé API [Mistral](https://console.mistral.ai)

## Installation

```bash
npm install
```

Copie le fichier d'environnement et remplis tes clés :

```bash
cp .env.local.example .env.local
```

## Lancer en local

```bash
npm run dev
```

L'app tourne sur [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
mcp/                    # Serveur MCP standalone (stdio)
├── tools/              # 13 tools (CRUD projets, tâches, membres, stats)
├── resources/          # Resource project://<id>
├── prompts/            # Prompts (standup, retrospective, task_breakdown)
├── lib/                # Client Supabase pour le serveur MCP
└── server.ts           # Point d'entrée du serveur
doc/
└── MCP_TOOLS.md        # Documentation détaillée des outils MCP
src/
├── app/
│   ├── (auth)/         # Pages auth (login, register)
│   ├── (legal)/        # Pages légales (CGU, confidentialité)
│   ├── api/            # Route handlers (endpoints backend)
│   └── dashboard/      # Pages protégées de l'app
├── components/         # Composants réutilisables (shadcn/ui)
├── lib/
│   ├── ai/             # Logique Mistral (client MCP)
│   ├── mcp/            # Logique MCP côté app
│   └── supabase/       # Logique Supabase (client, server, middleware)
└── types/              # Types TypeScript
```

## Base de données

Le schéma SQL est dans `supabase/schema.sql`. Exécute-le dans l'éditeur SQL de ton dashboard Supabase.

## Configuration MCP (Claude Desktop)

Le serveur MCP démarre automatiquement via Claude Desktop — aucune commande manuelle requise.

### Chemin du fichier de config

| OS | Chemin |
|---|---|
| **Windows** | `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |

### Contenu à ajouter

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
        "SUPABASE_SERVICE_ROLE_KEY": "<votre_service_role_key>"
      }
    }
  }
}
```

> Sur macOS, remplacer `"command": "cmd"` et `"args": ["/c", "npx", "tsx", ...]` par `"command": "npx"` et `"args": ["tsx", "..."]`.

Redémarrer Claude Desktop — le serveur s'initialise automatiquement et les tools sont disponibles dans le chat.

## Ressources MCP

- [Documentation officielle](https://modelcontextprotocol.io)
- SDK TypeScript : `@modelcontextprotocol/sdk` (npm)
- [Exemples de serveurs](https://github.com/modelcontextprotocol/servers)

## Build prod

```bash
npm run build
npm start
```
