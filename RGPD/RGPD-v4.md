# Audit RGPD -- v4

Date: 2026-03-31
Audit precedent: RGPD-v3.md (2026-03-28, score 6.5/10)

## 1. Synthese

- Le chat IA (Mistral, OpenRouter) et la table `prompts` ont ete supprimes du code source. Les findings critiques de la v3 (OpenRouter non conforme, prompts non exportes) ne sont plus applicables.
- La politique de confidentialite (`/privacy`) est desormais **obsolete** : elle mentionne encore Mistral AI, le chat intelligent et les conversations, qui n'existent plus dans l'application.
- Les tables `conversations` et `messages` existent toujours dans le schema SQL mais ne sont plus utilisees par aucune page ou API (hormis l'export). Elles constituent des donnees orphelines.
- Ajout du systeme de gamification (XP, level) dans les profils : ces champs ne sont pas inclus dans l'export de donnees.
- Le serveur MCP expose des donnees personnelles (emails, noms) a l'assistant Claude via le protocole MCP. Ce transfert n'est pas documente dans la politique de confidentialite.
- Les recommandations v2/v3 (timestamp consentement, rate limiting) n'ont toujours pas ete implementees.

Niveau de conformite estime: **7/10**
Evolution: **amelioration** par rapport a v3 (6.5/10) -- la suppression du chat/OpenRouter elimine les findings critiques, mais la politique de confidentialite obsolete et le MCP non documente creent de nouveaux ecarts.

---

## 2. Donnees personnelles collectees

### Donnees stockees (Supabase -- region EU Frankfurt)

| Table | Champs personnels | Base legale |
|-------|-------------------|-------------|
| auth.users | email, mot de passe (hashe), metadata | Execution du contrat |
| profiles | email, full_name, avatar_url, xp, level | Execution du contrat |
| projects | owner_id, name, description | Execution du contrat |
| project_members | user_id, role | Execution du contrat |
| tasks | assignee_id, title, description | Execution du contrat |
| conversations | user_id, title (table orpheline, non utilisee) | Plus de base legale |
| messages | content (table orpheline, non utilisee) | Plus de base legale |

### Donnees en localStorage

| Cle | Valeur | Sensibilite |
|-----|--------|-------------|
| cookie-notice-dismissed | "true" | Aucune (pas de PII) |
| color-theme | identifiant du theme couleur | Aucune |

### Cookies

| Cookie | Origine | Type | Consentement requis |
|--------|---------|------|---------------------|
| sb-*-auth-token | Supabase SSR | Session/auth (essentiel) | Non (strictement necessaire) |

---

## 3. Transferts vers des tiers

### Supabase (hebergement et BDD)

**Donnees transmises:** toutes les donnees utilisateur (profils, projets, taches).
**Statut:** CONFORME
**Fichiers:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

Mentionne dans la politique de confidentialite (section 5). Serveurs en UE (Francfort).

### Vercel (hebergement applicatif)

**Donnees transmises:** requetes HTTP, logs.
**Statut:** CONFORME
**Fichiers:** deploiement Next.js

Mentionne dans la politique de confidentialite et les mentions legales.

### Mistral AI -- PLUS UTILISE

**Statut:** A CORRIGER (mention obsolete)
**Fichiers:** `src/app/(legal)/privacy/page.tsx:85-98`

Mistral AI est toujours mentionne dans la politique de confidentialite (sections 4 et 5) alors que le chat et l'integration Mistral ont ete completement supprimes du code source. Aucun fichier `src/lib/ai/`, `src/app/api/chat/`, ou `src/app/dashboard/chat/` n'existe.

### Serveur MCP (Claude Desktop) -- NON DOCUMENTE

**Donnees transmises:** emails, noms, projets, taches, statistiques via le protocole MCP.
**Statut:** A CORRIGER
**Fichiers:** `mcp/server.ts`, `mcp/tools/*.ts`, `mcp/resources/*.ts`

Le serveur MCP expose 17 tools et 2 resources qui transmettent des donnees personnelles (emails, noms complets, contenu des taches) a l'assistant Claude via le protocole MCP. Ce transfert n'est pas mentionne dans la politique de confidentialite. Cependant, le MCP fonctionne en local (stdio) et les donnees ne transitent pas par un serveur tiers -- elles restent sur la machine de l'utilisateur qui a configure le MCP. L'impact RGPD est donc limite, mais l'information devrait etre documentee.

---

## 4. Consentement cookies

**Fichier:** `src/components/cookie-consent.tsx`
**Statut:** CONFORME

Bandeau informatif avec texte clair, bouton "Compris", lien vers `/privacy`. Seuls des cookies essentiels (auth Supabase) sont utilises. Pas de consentement prealable requis pour les cookies strictement necessaires.

---

## 5. Inscription et information

**Fichier:** `src/app/(auth)/register/page.tsx`
**Statut:** A CORRIGER

**Ce qui fonctionne :**
- Checkbox obligatoire "J'accepte la politique de confidentialite" (lignes 114-120)
- Lien vers `/privacy` (ouvre dans un nouvel onglet)
- Bouton desactive si checkbox non cochee (ligne 133)

**Points a corriger :**
1. **Pas de timestamp de consentement** : `supabase.auth.signUp()` (ligne 42) n'inclut pas de `consent_given_at` dans les metadata. La preuve du consentement n'est pas tracable (art. 7.1 RGPD).
2. **Politique de confidentialite obsolete** : la politique vers laquelle pointe la checkbox mentionne un chat IA et Mistral AI qui n'existent plus. Le consentement porte sur des traitements inexistants.

---

## 6. Droit a l'effacement (article 17)

**Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/delete/route.ts`
**Statut:** CONFORME

- Route API DELETE `/api/account/delete` avec verification de session
- `admin.auth.admin.deleteUser(session.user.id)` supprime l'utilisateur
- Cascades SQL confirmees pour : profiles, conversations, messages, projects, project_members (`supabase/schema.sql`)
- Tasks : `ON DELETE SET NULL` sur `assignee_id`, `ON DELETE CASCADE` via project
- Dialog de confirmation dans les parametres
- Champs de gamification (xp, level) dans profiles : supprimes par cascade

---

## 7. Droit d'acces et portabilite (articles 15 et 20)

**Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/export/route.ts`
**Statut:** PARTIEL

**Ce qui fonctionne :**
- Route API GET `/api/account/export` avec verification de session
- Export de : profile, conversations, messages
- Format JSON lisible avec indentation
- Header Content-Disposition correct
- Bouton "Exporter mes donnees" dans les parametres

**Points a corriger :**
1. **Projets et taches non inclus dans l'export** : la route exporte uniquement `profiles`, `conversations` et `messages` (`src/app/api/account/export/route.ts:14-41`). Les tables `projects`, `project_members` et `tasks` (donnees principales de l'application) ne sont pas exportees.
2. **Champs de gamification non inclus** : les champs `xp` et `level` de la table profiles sont recuperes par `select("*")` donc inclus, mais les tables de projets/taches ne le sont pas.

---

## 8. Duree de conservation

**Statut:** PARTIEL (inchange)

- La politique de confidentialite indique : "Vos donnees sont conservees tant que votre compte est actif."
- Pas de mecanisme de purge automatique apres inactivite.
- Pas de duree maximale de conservation definie.
- Les tables `conversations` et `messages` contiennent potentiellement des donnees orphelines d'un ancien chat qui n'est plus accessible via l'interface.

---

## 9. Securite des donnees (article 32)

### Points positifs
- RLS active sur toutes les tables : profiles, conversations, messages, projects, project_members, tasks (`supabase/schema.sql`)
- Toutes les policies RLS implementent un scope par utilisateur (via `auth.uid()` ou `is_project_member`)
- Mots de passe hashes par Supabase (bcrypt)
- Session via cookies HTTP-only (Supabase SSR)
- HTTPS via Supabase et Vercel
- Aucun script de tracking ou analytics
- En-tetes de securite : X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, CSP, frame-ancestors 'none' (`next.config.mjs:3-27`)
- API delete protegee par authentification (`src/app/api/account/delete/route.ts:6-10`)
- API export protegee par authentification (`src/app/api/account/export/route.ts:6-10`)
- Middleware de session fonctionnel (`src/lib/supabase/middleware.ts`)
- MCP server utilise l'authentification utilisateur (email/password) pour respecter les RLS (`mcp/lib/supabase.ts`)

### Points a corriger
- **Rate limiting absent** : aucun rate limiting sur `/api/account/delete` et `/api/account/export`. Fichiers concernes : `src/app/api/account/delete/route.ts`, `src/app/api/account/export/route.ts`.
- **CSP avec `unsafe-inline` et `unsafe-eval`** (`next.config.mjs:16`) : la directive `script-src` inclut `'unsafe-inline' 'unsafe-eval'`, ce qui reduit l'efficacite de la CSP contre les attaques XSS. Partiellement necessaire pour Next.js.

---

## 10. Mentions legales

**Pages:**
- `/privacy` -- politique de confidentialite (9 sections) : `src/app/(legal)/privacy/page.tsx`
- `/mentions-legales` -- editeur, hebergement, propriete intellectuelle : `src/app/(legal)/mentions-legales/page.tsx`

**Liens accessibles depuis:**
- Layout des pages auth (login, register, forgot-password) -- footer
- Sidebar du dashboard (quand depliee) -- `src/components/sidebar.tsx:78,81`
- Bandeau cookies -- lien vers /privacy : `src/components/cookie-consent.tsx`
- Page parametres -- lien vers /privacy

**Statut:** A CORRIGER

Le contenu de `/privacy` est obsolete : il mentionne Mistral AI comme sous-traitant et le chat comme fonctionnalite alors que ces elements ont ete supprimes. La section "Donnees collectees" mentionne les "Conversations : messages echanges avec l'assistant" (ligne 47-48) qui ne correspondent plus a la realite de l'application (gestion de projet). Les projets et taches ne sont pas mentionnes comme donnees collectees.

---

## 11. Bilan des corrections v3 -> v4

| # | Finding v3 | Priorite v3 | Statut v4 |
|---|-----------|-------------|-----------|
| N1 | OpenRouter actif sans mention dans /privacy | BLOQUANT | RESOLU (OpenRouter supprime du code) |
| N2 | Texte chat "Mistral AI" incorrect pour modeles OpenRouter | BLOQUANT | RESOLU (chat supprime du code) |
| N3 | Table prompts absente de l'export | HAUTE | RESOLU (table prompts supprimee) |
| N4 | Table prompts : cascade ON DELETE non confirmee | HAUTE | RESOLU (table supprimee) |
| N5 | Table prompts : RLS non confirmee | HAUTE | RESOLU (table supprimee) |
| 1 | Timestamp de consentement | RECOMMANDE | NON IMPLEMENTE |
| 2 | Rate limiting sur API | RECOMMANDE | NON IMPLEMENTE |
| 3 | Mentionner OpenRouter dans /privacy | RECOMMANDE | N/A (OpenRouter supprime) |
| 4 | Purge automatique | RECOMMANDE | NON IMPLEMENTE |
| 5-8 | DPA Mistral/Supabase, DPO, localisation | ADMINISTRATIF | NON FAIT |

**Nouveaux findings v4 :**

| # | Finding | Priorite |
|---|---------|----------|
| N1 | Politique de confidentialite obsolete (mentionne Mistral/chat supprimes) | HAUTE |
| N2 | Projets et taches non inclus dans l'export de donnees | HAUTE |
| N3 | Tables conversations/messages orphelines dans le schema | MOYENNE |
| N4 | MCP server non documente dans /privacy | BASSE |

---

## 12. Conformite par article RGPD

| Article | Sujet | v3 | v4 | Commentaire v4 |
|---------|-------|----|----|----------------|
| 5 | Principes de traitement | CONFORME | CONFORME | Finalites documentees, minimisation correcte |
| 6 | Base legale | CONFORME | CONFORME | Contrat + consentement |
| 7 | Conditions du consentement | A CORRIGER | A CORRIGER | Pas de timestamp, politique obsolete |
| 12 | Transparence | NON CONFORME | A CORRIGER | Politique obsolete (mentionne chat/Mistral supprimes, ne mentionne pas projets/taches) |
| 13 | Information a la collecte | NON CONFORME | A CORRIGER | Idem -- information ne correspond plus a la realite |
| 15 | Droit d'acces | PARTIEL | PARTIEL | Export incomplet (projets/taches manquants) |
| 16 | Droit de rectification | CONFORME | CONFORME | Modification profil dans parametres |
| 17 | Droit a l'effacement | PARTIEL | CONFORME | Cascades confirmees sur toutes les tables |
| 20 | Droit a la portabilite | PARTIEL | PARTIEL | Export incomplet (projets/taches manquants) |
| 25 | Protection par defaut | A VERIFIER | CONFORME | RLS active sur toutes les tables, pas de collecte excessive |
| 32 | Securite | PARTIEL | PARTIEL | Pas de rate limiting, CSP permissive |
| 44-49 | Transferts hors UE | NON CONFORME | CONFORME | Plus de transfert hors UE (OpenRouter supprime, Supabase en UE) |

---

## 13. Recommandations pour la v5

### Bloquant (a corriger immediatement)

1. **Mettre a jour la politique de confidentialite** -- Supprimer les references a Mistral AI, au chat intelligent et aux conversations. Ajouter les projets, taches et membres comme donnees collectees. Mettre a jour les finalites (gestion de projet au lieu de chat). Mettre a jour la table des sous-traitants (retirer Mistral AI). Fichier : `src/app/(legal)/privacy/page.tsx`.

### Recommande (non bloquant)

2. **Inclure les projets et taches dans l'export de donnees** -- Ajouter les tables `projects`, `project_members` et `tasks` dans `src/app/api/account/export/route.ts` pour une portabilite complete (art. 20).
3. **Supprimer ou nettoyer les tables orphelines** -- Les tables `conversations` et `messages` dans `supabase/schema.sql` ne sont plus utilisees par aucune page ou API (hormis l'export qui les inclut). Creer une migration pour les supprimer ou documenter leur conservation.
4. **Stocker le timestamp de consentement** -- Ajouter `consent_given_at: new Date().toISOString()` dans les metadata du `signUp` (`src/app/(auth)/register/page.tsx:42`) pour piste d'audit (art. 7.1).
5. **Rate limiting sur les routes API** -- Implementer un rate limiting par utilisateur sur `/api/account/delete` et `/api/account/export`.
6. **Purge automatique** -- Definir et implementer une duree maximale de conservation des comptes inactifs.
7. **Documenter le MCP dans /privacy** -- Ajouter une mention du serveur MCP dans la politique de confidentialite, en precisant que les donnees restent en local et ne sont pas transmises a des tiers.

### Administratif (hors perimetre technique)

8. **Signer un DPA avec Supabase** -- Supabase propose un DPA standard sur demande.
9. **Designer un contact DPO** -- Mentionner une adresse de contact dediee dans la politique de confidentialite.
10. **Mettre a jour le schema SQL** -- Synchroniser `supabase/schema.sql` avec l'etat reel de la base (ajouter les champs xp/level, le CHECK constraint a 5 statuts, et retirer ou marquer les tables obsoletes).
