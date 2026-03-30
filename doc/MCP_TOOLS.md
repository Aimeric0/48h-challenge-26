# MCP Server — Documentation des outils

> Serveur MCP `challenge48h-mcp` v1.0.0
> Transport : stdio
> SDK : `@modelcontextprotocol/sdk`
> Authentification : JWT utilisateur via `SUPABASE_USER_ACCESS_TOKEN` (voir [MCP_Info.md](./MCP_Info.md))

---

## Table des matières

- [Tools](#tools)
  - [Gestion de projets](#gestion-de-projets)
  - [Gestion de tâches](#gestion-de-tâches)
  - [Membres & collaboration](#membres--collaboration)
  - [Analytics & reporting](#analytics--reporting)
  - [Utilisateurs](#utilisateurs)
- [Resources](#resources)
- [Prompts](#prompts)

---

## Tools

### Gestion de projets

#### `list_projects`

Liste tous les projets, avec possibilité de filtrer par utilisateur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `user_id` | `string` | non | Filtrer les projets dont l'utilisateur est membre |

**Retour :** tableau de projets enrichis avec `task_count`, `done_count`, `overdue_count`, `member_count`.

---

#### `create_project`

Crée un nouveau projet et ajoute le propriétaire comme membre avec le rôle `owner`.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `name` | `string` | oui | Nom du projet |
| `description` | `string` | non | Description du projet |
| `deadline` | `string` | non | Deadline au format ISO 8601 |
| `owner_id` | `string` | oui | ID de l'utilisateur propriétaire |

**Retour :** objet projet créé.

---

#### `get_project_summary`

Résumé complet d'un projet : tâches, membres, statistiques de complétion.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |

**Retour :** objet projet enrichi avec `task_count`, `done_count`, `in_progress_count`, `todo_count`, `overdue_count`, `completion_percentage`, tableau `members` (avec profils) et tableau `tasks` (avec profils assignés).

---

### Gestion de tâches

#### `list_tasks`

Liste les tâches d'un projet, avec filtrage optionnel par statut.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `status` | `"todo" \| "in_progress" \| "done"` | non | Filtrer par statut |

**Retour :** tableau de tâches ordonnées par position, enrichies avec le profil de l'assigné.

---

#### `create_task`

Crée une nouvelle tâche dans un projet avec calcul automatique de la position.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `title` | `string` | oui | Titre de la tâche |
| `description` | `string` | non | Description détaillée |
| `status` | `"todo" \| "in_progress" \| "done"` | non | Statut (défaut : `todo`) |
| `assignee_id` | `string` | non | ID de l'utilisateur assigné |
| `deadline` | `string` | non | Deadline au format ISO 8601 |

**Retour :** objet tâche créée.

---

#### `update_task`

Mise à jour partielle d'une tâche. Seuls les champs fournis sont modifiés.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `task_id` | `string` | oui | ID de la tâche |
| `title` | `string` | non | Nouveau titre |
| `description` | `string` | non | Nouvelle description |
| `status` | `"todo" \| "in_progress" \| "done"` | non | Nouveau statut |
| `assignee_id` | `string \| null` | non | Nouvel assigné, ou `null` pour désassigner |
| `deadline` | `string \| null` | non | Nouvelle deadline, ou `null` pour supprimer |

**Retour :** objet tâche mis à jour.

---

#### `delete_task`

Supprime une tâche par son ID.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `task_id` | `string` | oui | ID de la tâche à supprimer |

**Retour :** `{ deleted: true, task: <tâche supprimée> }`.

---

#### `assign_task`

Assigne ou réassigne une tâche à un utilisateur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `task_id` | `string` | oui | ID de la tâche |
| `assignee_id` | `string \| null` | oui | ID de l'utilisateur, ou `null` pour désassigner |

**Retour :** objet tâche mis à jour.

---

### Membres & collaboration

#### `list_members`

Liste tous les membres d'un projet avec leurs profils.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |

**Retour :** tableau d'objets `{ user_id, role, joined_at, profile: { id, full_name, email, avatar_url } }`.

---

#### `invite_member`

Invite un utilisateur dans un projet par son adresse email.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `email` | `string` | oui | Email de l'utilisateur à inviter |
| `role` | `string` | non | Rôle à attribuer (défaut : `member`) |

**Retour :** `{ invited: true, user: <profil>, role: <rôle> }`.

**Erreurs possibles :**
- Utilisateur non trouvé avec cet email
- Utilisateur déjà membre du projet

---

### Analytics & reporting

#### `get_overdue_tasks`

Récupère toutes les tâches en retard (deadline dépassée et statut ≠ `done`).

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | non | Filtrer par projet (tous les projets si omis) |

**Retour :** tableau de tâches en retard, triées par deadline croissante, avec le nom du projet associé.

---

#### `get_user_tasks`

Récupère toutes les tâches assignées à un utilisateur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `user_id` | `string` | oui | ID de l'utilisateur |
| `status` | `"todo" \| "in_progress" \| "done"` | non | Filtrer par statut |

**Retour :** tableau de tâches avec le nom du projet associé, triées par deadline croissante.

---

#### `get_project_stats`

Statistiques détaillées d'un projet : taux de complétion et vélocité hebdomadaire.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |

**Retour :**

```json
{
  "total_tasks": 12,
  "todo": 3,
  "in_progress": 4,
  "done": 5,
  "completion_rate": 42,
  "overdue": 2,
  "weekly_velocity": [
    { "week": "2026-03-09 → 2026-03-16", "completed": 1 },
    { "week": "2026-03-16 → 2026-03-23", "completed": 3 },
    { "week": "2026-03-23 → 2026-03-30", "completed": 0 },
    { "week": "2026-03-30 → 2026-04-06", "completed": 1 }
  ]
}
```

---

### Utilisateurs

#### `get_user_by_email`

Recherche un utilisateur par son adresse email et retourne son profil.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `email` | `string` | oui | Adresse email de l'utilisateur |

**Retour :** `{ id, full_name, email }`.

**Erreurs possibles :**
- Utilisateur non trouvé avec cet email

---

## Resources

#### `project://{id}`

Ressource complète d'un projet, consommable par un assistant IA.

**URI :** `project://<project_id>`
**MIME type :** `application/json`

**Contenu :** snapshot complet du projet incluant :
- Toutes les propriétés du projet
- `task_count`, `done_count`, `overdue_count`, `completion_percentage`
- Tableau `members` enrichi avec les profils utilisateurs
- Tableau `tasks` enrichi avec les profils des assignés

---

## Prompts

#### `standup`

Génère un template de daily standup pour un projet.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `user_name` | `string` | non | Nom de l'utilisateur |

**Contenu généré :** template Markdown avec contexte projet, sections « Ce que j'ai fait hier », « Ce que je fais aujourd'hui », « Blocages », et résumé des tâches en cours / en retard / terminées.

---

#### `retrospective`

Génère un template de rétrospective sprint.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `sprint_name` | `string` | non | Nom du sprint |

**Contenu généré :** template Markdown avec résumé (tâches terminées / en cours / en retard), sections « Ce qui a bien fonctionné », « Problèmes rencontrés », « Actions d'amélioration ».

---

#### `task_breakdown`

Décompose un objectif en sous-tâches suggérées, en tenant compte des tâches existantes.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `project_id` | `string` | oui | ID du projet |
| `objective` | `string` | oui | Objectif ou fonctionnalité à décomposer |

**Contenu généré :** prompt Markdown listant les tâches existantes et demandant une décomposition en sous-tâches avec titre, estimation de complexité (S/M/L) et dépendances.
