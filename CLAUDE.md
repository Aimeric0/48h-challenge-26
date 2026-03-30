# Challenge 48h — Gestion de Projet × MCP

## Objectif
Application web de gestion de projet pensee par et pour les etudiants en informatique, couplee a un serveur MCP (Model Context Protocol) permettant a un assistant de piloter l'app en langage naturel via Mistral.

**Vision :** rendre la gestion de projet tellement fluide et integree dans le workflow quotidien que les etudiants la maintiennent naturellement, sans effort supplementaire.

**Deadline :** 48h (30 & 31 mars 2026)

**Livrables :** App locale + demo live | Repo GitHub + README | Pitch 10 min + 10 min questions

## Stack
- Next.js 16+ (App Router)
- TypeScript strict
- Tailwind CSS + shadcn/ui pour tout composant UI
- Supabase (auth, BDD, storage, RLS)
- Mistral pour l'assistant conversationnel (client MCP)
- @modelcontextprotocol/sdk pour le serveur MCP

## Regles ABSOLUES
- Ne fais JAMAIS de git commit toi-meme, je commite manuellement
- Pas de Co-authored-by dans les commits
- Code et commentaires en anglais, UI en francais
- Utilise shadcn/ui pour TOUT composant (boutons, inputs, modals, tables, etc.)

## Socle obligatoire (55 pts)

### Pilier 1 — App Web (30 pts)
L'interface principale. Rapide, intuitive, donne envie d'y revenir.

- Authentification (inscription/connexion email + mdp, chaque utilisateur a un profil)
- Gestion de projets (CRUD, inviter des membres)
- Gestion de taches (CRUD, assignation, statut To Do/In Progress/Done minimum, deadline)
- Board visuel (Kanban)
- Dashboard projet (progression globale, taches en retard, activite recente)

### Pilier 2 — Serveur MCP (25 pts)
Le pont vers l'assistant. Expose les fonctionnalites de l'app via le protocole MCP.

**Tools :**
- `list_projects` — lister les projets de l'utilisateur connecte
- `list_tasks` — lister les taches d'un projet (filtres : statut, assignation, deadline)
- `create_task` — creer une tache (titre, description, assignation)
- `update_task` — modifier statut, assignation ou deadline
- `get_project_summary` — resume structure (stats + taches critiques)

**Resources :**
- `project://<id>` — donnees completes du projet, lisibles par l'assistant

**Prompts :**
- `prompt://standup` — template pour generer un daily standup automatique

## Fonctionnalites avancees (points bonus significatifs)
- Gamification — XP, badges, streaks (series de jours actifs), classement equipe. Chaque action de gestion = micro-recompense.
- Notifications intelligentes — rappels contextuels (deadline dans 24h, tache bloquee depuis 3 jours, membre inactif). Via email, push, ou in-app.

## Fonctionnalites bonus (epater le jury)
- Integration Git — lier commits/branches/PRs aux taches, passage auto en Done quand PR mergee, webhook GitHub/GitLab
- Timeline / Gantt simplifie — vue temporelle des taches avec dependances
- Retrospective integree — a la fin d'un sprint/projet, outil de retro rapide (what went well / what to improve)
- MCP avance — tools supplementaires : standup auto, detection risques de retard, suggestion repartition de taches, poster un resume dans un channel
- Liberte totale pour inventer des fonctionnalites utiles aux etudiants dev

## Evaluation
| Critere | Points | Detail |
|---------|--------|--------|
| Fonctionnalites (socle) | /30 | Toutes les features du socle implementees et fonctionnelles. App utilisable de bout en bout. |
| Serveur MCP | /25 | Expose les tools du socle, fonctionne avec un client MCP, donnees structurees, gestion d'erreurs. |
| UX / Design | /15 | Interface intuitive, agreable, donne envie. Responsive apprecie. |
| Qualite du code | /10 | Capacite a repondre au besoin en se mettant a la place de l'utilisateur final. |
| Pitch & Demo | /10 | Clarte de la presentation, qualite de la demo live, capacite a vendre le produit. |
| Bonus (avance/bonus) | /10 | Fonctionnalites avancees ou bonus. Creativite et originalite. |
| **TOTAL** | **/100** | |

> Le jury valorise un socle solide et bien fini plutot qu'un projet ambitieux mais casse. Mieux vaut un MVP parfait que quelque chose d'inutilisable.

## Charte graphique (branch feature/project/nathan)
| Role | Hex | HSL (CSS var) |
|------|-----|---------------|
| Primary | `#8B5CF6` | `258 89% 66%` — violet |
| Secondary | `#F59E0B` | `38 92% 50%` — amber |
| Accent | `#EC4899` | `330 81% 60%` — pink |
| Background | `#FFFDF8` | `43 100% 99%` — warm cream |
| Card | `#FFFFFF` | `0 0% 100%` — white |
| Text | `#1F2937` | `215 28% 17%` — dark slate |

Ces valeurs sont les valeurs par defaut du theme (`:root`). Les themes de couleur utilisateur dans `lib/themes.ts` viennent surcharger `--primary` et derives.

## Conventions
- Un composant = un fichier
- Logique Supabase isolee dans /lib/supabase/
- Logique Mistral isolee dans /lib/ai/
- Logique MCP isolee dans /lib/mcp/ ou /mcp-server/
- Types dans /types/
- Variables d'env dans .env.local (jamais hardcodees)

## Ressources MCP
- Documentation officielle : https://modelcontextprotocol.io
- SDK TypeScript : `@modelcontextprotocol/sdk` (npm)
- SDK Python : `mcp` (pip)
- Exemples de serveurs : https://github.com/modelcontextprotocol/servers

### Primitives MCP
| Concept | Description | Exemple |
|---------|-------------|---------|
| Tool | Action que l'assistant peut executer | `create_task`, `update_task` |
| Resource | Donnee structuree que l'assistant peut lire | `project://<id>` |
| Prompt | Template de conversation pre-configure | `prompt://standup` |

## Documentation projet
- AUDIT/ — audits techniques et securite (bugs, failles, dette)
- FEATURES/ — etat des features par version (FEATURE-v1, v2, etc.)
- RGPD/ — audits de conformite RGPD
- .claude/doc/ — decisions d'architecture (ex: decision-IA.md pour le choix des modeles/modes)
- Consulte FEATURES/ avant de recommander ou ameliorer une feature existante
- Consulte RGPD/ avant toute modification touchant aux donnees personnelles ou services tiers
- Consulte .claude/doc/decision-IA.md avant toute modification liee aux modeles ou providers

## RGPD
- Consentement cookies obligatoire
- Bouton suppression de compte
- Pas de tracking externe
- Donnees stockees en EU (Supabase region Frankfurt)
