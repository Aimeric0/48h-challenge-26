# MCP Server — Authentification & Securite

> Comment le serveur MCP sait-il au nom de quel utilisateur il agit ?

---

## Le probleme initial

Le serveur MCP s'execute en tant que processus independant (stdio). Il n'a pas de session navigateur, pas de cookies, pas de contexte utilisateur natif. Sans mecanisme d'authentification, il pourrait agir sur **n'importe quelle donnee** de **n'importe quel utilisateur**.

---

## La solution : auto-login + RLS Supabase

### Principe

Au lieu d'utiliser la **Service Role Key** (cle admin qui bypass toutes les regles de securite), le serveur MCP **se connecte lui-meme** a Supabase Auth avec l'email et le mot de passe de l'utilisateur. Il obtient un JWT automatiquement, et Supabase le rafraichit quand il expire.

Cela permet aux **Row Level Security (RLS) policies** de Supabase de s'appliquer automatiquement : chaque requete est executee **en tant que** l'utilisateur authentifie.

### Schema du flux

```
Configuration Claude Desktop (.mcp.json)
        |
        | 1. Contient MCP_USER_EMAIL + MCP_USER_PASSWORD
        |
        v
   Serveur MCP (stdio) — au demarrage
        |
        | 2. Appelle supabase.auth.signInWithPassword()
        | 3. Obtient un JWT valide (rafraichi automatiquement)
        |
        v
   Chaque appel tool
        |
        | 4. Utilise le client Supabase authentifie
        | 5. Les RLS policies s'appliquent via auth.uid()
        |
        v
   Supabase (base de donnees)
        |
        | 6. Autorise ou refuse l'operation selon les policies
```

### Ce qui se passe concretement

1. L'email et le mot de passe sont configures dans `.mcp.json` (env vars `MCP_USER_EMAIL` et `MCP_USER_PASSWORD`)
2. Au premier appel d'un tool, le serveur MCP appelle `signInWithPassword()` → obtient un JWT
3. Le client Supabase est configure avec `autoRefreshToken: true` → le JWT est rafraichi automatiquement
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

## Variables d'environnement requises

```bash
MCP_USER_EMAIL=utilisateur@example.com
MCP_USER_PASSWORD=mot-de-passe
```

Le serveur MCP **refuse de demarrer** si ces variables ne sont pas fournies.

### Configuration Claude Desktop (`.mcp.json`)

```json
{
  "mcpServers": {
    "challenge48h": {
      "command": "cmd",
      "args": ["/c", "npx", "tsx", "mcp/server.ts"],
      "env": {
        "MCP_USER_EMAIL": "ton-email@example.com",
        "MCP_USER_PASSWORD": "ton-mot-de-passe"
      }
    }
  }
}
```

---

## Avant / Apres

### Avant (Service Role Key)

- Le serveur MCP utilisait `SUPABASE_SERVICE_ROLE_KEY` (cle admin)
- **Toutes les RLS policies etaient ignorees**
- N'importe quel tool pouvait lire/modifier/supprimer n'importe quelle donnee
- Le `user_id` etait passe en parametre par l'assistant → aucune garantie que c'etait le bon

### Apres (auto-login utilisateur)

- Le serveur MCP se connecte avec les identifiants de l'utilisateur
- **Les RLS policies s'appliquent automatiquement**
- L'utilisateur ne peut acceder qu'aux projets/taches dont il est membre
- Impossible de supprimer le projet d'un autre utilisateur
- Le JWT est **rafraichi automatiquement** — pas d'expiration
- L'identite est **cryptographiquement garantie** par le JWT (signe par Supabase)

---

## Pourquoi c'est la bonne approche

1. **Une seule source de verite** : les regles de securite sont definies dans Supabase (RLS policies), pas dupliquees dans chaque tool MCP
2. **Impossible de contourner** : meme si l'assistant essaie de passer un mauvais `user_id`, Supabase utilise le JWT (pas le parametre)
3. **Coherence** : les memes regles s'appliquent que l'utilisateur passe par le frontend web ou par l'assistant MCP
4. **Pas de code d'autorisation custom** : zero logique de verification dans les tools, Supabase fait tout
5. **Zero intervention manuelle** : pas besoin de copier un token, le serveur se connecte tout seul

---

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `mcp/lib/supabase.ts` | Auto-login via `signInWithPassword()`, export `getSupabase()` async |
| `mcp/server.ts` | Validation des credentials au demarrage |
| `mcp/tools/*.ts` | Import `getSupabase` au lieu de `supabase`, `await getSupabase()` au debut de chaque fonction |
| `mcp/resources/*.ts` | Idem |
| `mcp/prompts/*.ts` | Idem |
| `supabase/schema.sql` | Policy profiles elargie : tout utilisateur authentifie peut voir les profils |
