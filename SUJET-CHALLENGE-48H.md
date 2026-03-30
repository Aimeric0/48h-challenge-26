# Challenge 48h — Gestion de Projet × MCP

## Contexte

Application web de gestion de projet pensée par et pour les étudiants en informatique, couplée à un serveur MCP (Model Context Protocol) permettant à un assistant IA d'interagir avec l'app en langage naturel.

**Objectif :** rendre la gestion de projet tellement fluide et intégrée dans le workflow quotidien que les étudiants la maintiennent naturellement, sans effort supplémentaire.

**Contrainte temps :** 48h (30 & 31 mars 2026)

**Livrables :** App locale + démo live | Repo GitHub + README | Pitch 10 min + 10 min questions

---

## Pilier 1 — Application Web

L'interface principale. Les étudiants visualisent leurs projets, suivent l'avancement et interagissent avec leur équipe. Rapide, intuitive, donne envie d'y revenir.

## Pilier 2 — Serveur MCP

Le pont vers l'IA. Expose les fonctionnalités de l'app via le protocole MCP, permettant à un assistant IA de créer des tâches, générer des résumés, relancer les membres, etc. en langage naturel.

---

## Cahier des charges fonctionnel

### 3.1 Socle obligatoire — Application Web

- **Authentification** — Inscription / connexion (email + mot de passe minimum). Chaque utilisateur a un profil.
- **Gestion de projets** — Créer un projet, inviter des membres.
- **Gestion de tâches** — CRUD complet : créer, assigner, changer de statut (To Do / In Progress / Done au minimum), fixer une deadline.
- **Board visuel** — Tableau de bord visuel du projet, avancées des tâches.
- **Dashboard projet** — Vue synthétique : progression globale, tâches en retard, activité récente.

### 3.1 Socle obligatoire — Serveur MCP

- `list_projects` — Lister les projets de l'utilisateur connecté.
- `list_tasks` — Lister les tâches d'un projet (filtres : statut, assignation, deadline).
- `create_task` — Créer une tâche dans un projet avec titre, description, assignation.
- `update_task` — Modifier le statut, l'assignation ou la deadline d'une tâche.
- `get_project_summary` — Retourner un résumé structuré de l'état du projet (stats + tâches critiques).
- `project://<id>` — Exposer les données du projet comme resource MCP lisible par l'IA.

### 3.2 Fonctionnalités avancées (points bonus significatifs)

- **Gamification** — Système de points d'XP, badges, streaks (séries de jours actifs), classement d'équipe. Transformer chaque action de gestion en micro-récompense.
- **Notifications intelligentes** — Rappels contextuels (deadline dans 24h, tâche bloquée depuis 3 jours, membre inactif). Via email, push, ou in-app.

### 3.3 Fonctionnalités bonus (épater le jury)

- **Intégration Git** — Lier les commits/branches/PRs aux tâches. Passage automatique en Done quand une PR est mergée. Webhook GitHub/GitLab.
- **Timeline / Gantt simplifié** — Vue temporelle des tâches avec dépendances.
- **Rétrospective intégrée** — À la fin d'un sprint/projet, outil de rétro rapide (what went well / what to improve).
- **MCP avancé** — Tools supplémentaires : générer un standup automatique, détecter les risques de retard, suggérer une répartition de tâches, poster un résumé dans un channel.
- Liberté totale pour inventer des fonctionnalités utiles aux étudiants dev.

---

## Critères d'évaluation

| Critère | Points | Détail |
|---------|--------|--------|
| Fonctionnalités (socle) | /30 | Toutes les features du socle implémentées et fonctionnelles. App utilisable de bout en bout. |
| Serveur MCP | /25 | Expose les tools du socle, fonctionne avec un client MCP, données structurées, gestion d'erreurs. |
| UX / Design | /15 | Interface intuitive, agréable, donne envie. Responsive apprécié. |
| Qualité du code | /10 | Capacité à répondre au besoin en se mettant à la place de l'utilisateur final. |
| Pitch & Démo | /10 | Clarté de la présentation, qualité de la démo live, capacité à vendre le produit. |
| Bonus (avancé/bonus) | /10 | Fonctionnalités avancées ou bonus. Créativité et originalité. |
| **TOTAL** | **/100** | |

> Le jury valorisera un socle solide et bien fini plutôt qu'un projet ambitieux mais cassé. Mieux vaut un MVP parfait que quelque chose d'inutilisable.

---

## Ressources MCP

- Documentation officielle : https://modelcontextprotocol.io
- SDK TypeScript : `@modelcontextprotocol/sdk` (npm)
- SDK Python : `mcp` (pip)
- Exemples de serveurs : https://github.com/modelcontextprotocol/servers

### Rappel : primitives MCP

| Concept | Description | Exemple |
|---------|-------------|---------|
| Tool | Action que l'IA peut exécuter | `create_task`, `update_task`, `assign_member` |
| Resource | Donnée structurée que l'IA peut lire | `project://<id>` → données complètes du projet |
| Prompt | Template de conversation pré-configuré | `prompt://standup` → génère le daily standup |
