# MCP Server — Authentification & Securite

> Comment le serveur MCP sait-il au nom de quel utilisateur il agit ?

---

## Le probleme initial

Le serveur MCP s'execute en tant que processus independant (stdio). Il n'a pas de session navigateur, pas de cookies, pas de contexte utilisateur natif. Sans mecanisme d'authentification, il pourrait agir sur **n'importe quelle donnee** de **n'importe quel utilisateur**.

---

## La solution : JWT utilisateur + RLS Supabase

### Principe

Au lieu d'utiliser la **Service Role Key** (cle admin qui bypass toutes les regles de securite), le serveur MCP utilise le **JWT (token d'acces) de l'utilisateur connecte** combine avec la **cle publique** (anon key) de Supabase.

Cela permet aux **Row Level Security (RLS) policies** de Supabase de s'appliquer automatiquement : chaque requete est executee **en tant que** l'utilisateur authentifie.

### Schema du flux

```
Utilisateur connecte (navigateur)
        |
        | 1. Se connecte via Supabase Auth → obtient un JWT
        |
        v
   Frontend / Client MCP
        |
        | 2. Lance le serveur MCP avec SUPABASE_USER_ACCESS_TOKEN=<jwt>
        |
        v
   Serveur MCP (stdio)
        |
        | 3. Cree un client Supabase avec le JWT de l'utilisateur
        | 4. Chaque appel tool passe par les RLS policies
        |
        v
   Supabase (base de donnees)
        |
        | 5. auth.uid() = l'utilisateur connecte
        | 6. Les policies autorisent ou refusent l'operation
```

### Ce qui se passe concretement

1. L'utilisateur se connecte sur l'app → Supabase lui delivre un **JWT** (JSON Web Token)
2. Ce JWT est passe au serveur MCP via la variable d'environnement `SUPABASE_USER_ACCESS_TOKEN`
3. Le serveur MCP cree un client Supabase qui inclut ce token dans chaque requete HTTP
4. Supabase decode le JWT → extrait le `user_id` → le rend disponible via `auth.uid()`
5. Les **RLS policies** filtrent automatiquement les donnees

---

## Comment les RLS policies protegent les donnees

### Projets

| Action | Regle |
|--------|-------|
| Voir un projet | Etre owner **ou** membre du projet |
| Creer un projet | Etre authentifie (owner = soi-meme) |
| Modifier un projet | Etre owner |
| Supprimer un projet | Etre owner |

### Taches

| Action | Regle |
|--------|-------|
| Voir les taches | Etre membre du projet |
| Creer une tache | Etre membre du projet |
| Modifier une tache | Etre membre du projet |
| Supprimer une tache | Etre membre du projet |

### Membres

| Action | Regle |
|--------|-------|
| Voir les membres | Etre membre du projet |
| Ajouter un membre | Etre owner du projet |
| Retirer un membre | Etre owner du projet |

### Profils

| Action | Regle |
|--------|-------|
| Voir un profil | Etre authentifie (necessaire pour inviter, voir les assignes, etc.) |
| Modifier un profil | Etre le proprietaire du profil |

---

## Variable d'environnement requise

```bash
SUPABASE_USER_ACCESS_TOKEN=<jwt_de_l_utilisateur>
```

Le serveur MCP **refuse de demarrer** si cette variable n'est pas fournie. Un message d'erreur explicite est affiche.

---

## Avant / Apres

### Avant (Service Role Key)

- Le serveur MCP utilisait `SUPABASE_SERVICE_ROLE_KEY` (cle admin)
- **Toutes les RLS policies etaient ignorees**
- N'importe quel tool pouvait lire/modifier/supprimer n'importe quelle donnee
- Le `user_id` etait passe en parametre par l'assistant → aucune garantie que c'etait le bon

### Apres (JWT utilisateur)

- Le serveur MCP utilise le JWT de l'utilisateur connecte
- **Les RLS policies s'appliquent automatiquement**
- L'utilisateur ne peut acceder qu'aux projets/taches dont il est membre
- Impossible de supprimer le projet d'un autre utilisateur
- L'identite est **cryptographiquement garantie** par le JWT (signe par Supabase)

---

## Pourquoi c'est la bonne approche

1. **Une seule source de verite** : les regles de securite sont definies dans Supabase (RLS policies), pas dupliquees dans chaque tool MCP
2. **Impossible de contourner** : meme si l'assistant essaie de passer un mauvais `user_id`, Supabase utilise le JWT (pas le parametre)
3. **Coherence** : les memes regles s'appliquent que l'utilisateur passe par le frontend web ou par l'assistant MCP
4. **Pas de code d'autorisation custom** : zero logique de verification dans les tools, Supabase fait tout

---

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `mcp/lib/supabase.ts` | Remplace `SERVICE_ROLE_KEY` par `PUBLISHABLE_KEY` + `Bearer <JWT>` |
| `mcp/server.ts` | Validation du token au demarrage, erreur explicite si absent |
| `supabase/schema.sql` | Policy profiles elargie : tout utilisateur authentifie peut voir les profils |
