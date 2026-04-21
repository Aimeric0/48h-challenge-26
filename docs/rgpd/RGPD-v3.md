# Audit RGPD -- v3

Date: 2026-03-28
Audit precedent: RGPD-v2.md (2026-03-28, score 8/10)

## 1. Synthese

- Les corrections de la v2 (politique de confidentialite, consentement, suppression, export, headers) restent en place et fonctionnelles.
- **Nouveau finding critique** : OpenRouter est integre comme provider (Llama 3.3 70B, Nemotron 2 Super) mais n'est pas mentionne dans la politique de confidentialite ni dans l'information utilisateur du chat. Les donnees transitent par un service americain sans information adequate.
- **Nouveau finding** : une table `prompts` contient des donnees personnelles (contenu utilisateur) mais n'est pas incluse dans l'export de donnees ni confirmee dans le schema SQL (cascades, RLS).
- Le texte informatif du chat affiche toujours "Vos messages sont traites par Mistral AI" meme quand le modele selectionne utilise OpenRouter.
- Les recommandations v2 (timestamp de consentement, rate limiting, mention OpenRouter) n'ont pas ete implementees.

Niveau de conformite estime: **6.5/10**
Evolution: **regression** par rapport a v2 (8/10), principalement due au deploiement d'OpenRouter sans mise a jour de l'information utilisateur et a l'ajout de la table prompts sans couverture dans l'export/suppression.

---

## 2. Donnees personnelles collectees

### Donnees stockees (Supabase -- region EU Frankfurt)

| Table | Champs personnels | Base legale |
|-------|-------------------|-------------|
| auth.users | email, mot de passe (hashe), metadata | Execution du contrat |
| profiles | email, nom complet, avatar_url | Execution du contrat |
| conversations | user_id, titre (extrait du message) | Interet legitime |
| messages | contenu integral des echanges | Interet legitime |
| **prompts** (NOUVEAU) | user_id, title, content, category | Interet legitime |

**Remarque sur `prompts`** : cette table n'apparait pas dans `supabase/schema.sql`. Son existence est confirmee par le code (`src/app/dashboard/prompts/page.tsx`, `src/types/database.ts:26-34`) qui effectue des operations CRUD dessus. L'absence dans le schema SQL rend impossible la verification des politiques RLS et des cascades ON DELETE depuis cette analyse statique.

### Donnees en localStorage

| Cle | Valeur | Sensibilite |
|-----|--------|-------------|
| cookie-notice-dismissed | "true" | Aucune (pas de PII) |
| theme | "light", "dark" ou "system" | Aucune |
| color-theme | identifiant du theme couleur | Aucune |

### Cookies

| Cookie | Origine | Type | Consentement requis |
|--------|---------|------|---------------------|
| sb-*-auth-token | Supabase SSR | Session/auth (essentiel) | Non (strictement necessaire) |

---

## 3. Transferts vers des tiers

### Mistral AI

**Donnees transmises:** historique de conversation, prompt systeme, modele selectionne.
**Statut:** CONFORME (information presente)
**Fichiers:** `src/lib/ai/mistral.ts`, `src/app/api/chat/route.ts`

L'utilisateur est informe dans le chat (ligne 390-403 de `src/app/dashboard/chat/page.tsx`) et dans la politique de confidentialite (section 4 de `src/app/(legal)/privacy/page.tsx`). Mention du risque d'entrainement sur le plan gratuit.

### OpenRouter -- NON CONFORME (CRITIQUE)

**Donnees transmises:** historique de conversation complet, prompt systeme, modele selectionne.
**Statut:** NON CONFORME
**Fichiers:** `src/lib/ai/openrouter.ts`, `src/lib/ai/models.ts:56-68`, `src/app/api/chat/route.ts:46-48`

**Problemes identifies :**
1. **Politique de confidentialite** (`src/app/(legal)/privacy/page.tsx`) : ne mentionne pas OpenRouter. La section "Destinataires des donnees" (section 4) ne liste que Mistral AI et Supabase. La table des sous-traitants (section 5) ne liste pas OpenRouter.
2. **Information dans le chat** (`src/app/dashboard/chat/page.tsx:390-403`) : le texte affiche "Vos messages sont traites par Mistral AI" meme quand l'utilisateur selectionne un modele OpenRouter (Llama 3.3 70B ou Nemotron 2 Super). L'utilisateur est activement desinforme.
3. **Localisation des serveurs** : OpenRouter est une societe americaine. Les donnees transitent hors de l'UE sans base legale documentee (pas de clauses contractuelles types, pas de decision d'adequation).
4. **Modeles disponibles via OpenRouter** (`src/lib/ai/models.ts:56-68`) :
   - `meta-llama/llama-3.3-70b-instruct:free` (Meta, via OpenRouter)
   - `nvidia/nemotron-2-super:free` (NVIDIA, via OpenRouter)
5. **Pas de DPA** avec OpenRouter.

### Vercel (hebergement)

**Statut:** Mentionne dans les mentions legales et dans la table des sous-traitants de /privacy.
**Localisation:** International (CDN). Mentionne comme "International (CDN)" dans la politique, ce qui est transparent.

### Google Fonts

**Statut:** Non concerne. Next.js self-host les polices au build (`src/app/layout.tsx:8`, utilisation de `next/font/google`). Aucune requete vers Google en runtime.

---

## 4. Consentement cookies

**Fichier:** `src/components/cookie-consent.tsx`
**Statut:** CONFORME

Inchange depuis v2. Bandeau informatif avec texte clair, bouton "Compris", lien vers /privacy. Seuls des cookies essentiels (auth Supabase) sont utilises. Pas de consentement prealable requis.

---

## 5. Inscription et information

**Fichier:** `src/app/(auth)/register/page.tsx`
**Statut:** A CORRIGER

**Ce qui fonctionne :**
- Checkbox obligatoire "J'accepte la politique de confidentialite" (lignes 112-130)
- Lien vers /privacy (ouvre dans un nouvel onglet)
- Bouton desactive si checkbox non cochee (ligne 133)

**Points a corriger :**
1. **Pas de timestamp de consentement** (recommandation v2 non implementee) : `supabase.auth.signUp()` (ligne 42-48) n'inclut pas de `consent_given_at` dans les metadata. Sans timestamp, la preuve du consentement n'est pas tracable (art. 7.1 RGPD).
2. **Information incomplete** : la politique de confidentialite vers laquelle pointe la checkbox ne mentionne pas OpenRouter, donc le consentement recueilli ne couvre pas ce transfert.

---

## 6. Droit a l'effacement (article 17)

**Fichiers:** `src/app/dashboard/settings/page.tsx:102-118`, `src/app/api/account/delete/route.ts`
**Statut:** PARTIEL (regression depuis v2)

**Ce qui fonctionne :**
- Route API DELETE `/api/account/delete` avec verification de session (ligne 7-9)
- `admin.auth.admin.deleteUser(session.user.id)` (ligne 14)
- Cascades SQL confirmees pour : profiles, conversations, messages (via `supabase/schema.sql`)
- Dialog de confirmation avec avertissement (lignes 305-340 de settings/page.tsx)

**Points a corriger :**
1. **Table `prompts` non couverte** : la table `prompts` n'apparait pas dans `supabase/schema.sql`. Si elle n'a pas de contrainte `ON DELETE CASCADE` sur `user_id` referençant `auth.users`, les prompts de l'utilisateur ne seront PAS supprimes lors de la suppression du compte. A verifier dans les migrations Supabase reelles.
2. Les donnees deja transmises a Mistral et OpenRouter ne sont pas recuperables (mentionne dans /privacy pour Mistral uniquement).

---

## 7. Droit d'acces et portabilite (articles 15 et 20)

**Fichiers:** `src/app/dashboard/settings/page.tsx:120-136`, `src/app/api/account/export/route.ts`
**Statut:** PARTIEL (regression depuis v2)

**Ce qui fonctionne :**
- Route API GET `/api/account/export` avec verification de session
- Export de : profile, conversations, messages
- Format JSON lisible avec indentation
- Header Content-Disposition correct
- Bouton "Exporter mes donnees" dans les parametres

**Point a corriger :**
1. **Les prompts ne sont pas inclus dans l'export** (`src/app/api/account/export/route.ts:14-41`). La route exporte uniquement `profiles`, `conversations` et `messages`. La table `prompts` est absente. L'utilisateur ne peut pas obtenir une copie complete de ses donnees.

---

## 8. Duree de conservation

**Statut:** PARTIEL (inchange depuis v2)

- La politique de confidentialite indique : "Vos donnees sont conservees tant que votre compte est actif."
- Pas de mecanisme de purge automatique apres inactivite.
- Pas de duree maximale de conservation definie.

---

## 9. Securite des donnees (article 32)

### Points positifs
- RLS active sur les tables profiles, conversations, messages (confirme dans `supabase/schema.sql`)
- Mots de passe hashes par Supabase (bcrypt)
- Session via cookies HTTP-only (Supabase SSR)
- HTTPS via Supabase
- Aucun script de tracking ou analytics
- En-tetes de securite : X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, CSP (`next.config.mjs:3-27`)
- API chat protegee par authentification (`src/app/api/chat/route.ts:21-23`)
- API delete protegee par authentification (`src/app/api/account/delete/route.ts:7-9`)
- API export protegee par authentification (`src/app/api/account/export/route.ts:7-9`)
- Middleware de session fonctionnel (`src/lib/supabase/middleware.ts`)
- Rotation des cles API Mistral (`src/lib/ai/mistral.ts:9-27`) et OpenRouter (`src/lib/ai/openrouter.ts:8-22`)

### Points a corriger
- **RLS sur la table `prompts`** : non verifiable depuis `supabase/schema.sql` car la table n'y figure pas. A verifier dans la base Supabase reelle. Si RLS n'est pas active, n'importe quel utilisateur authentifie pourrait acceder aux prompts des autres.
- **Rate limiting absent** (recommandation v2 non implementee) : aucun rate limiting sur `/api/chat`, `/api/account/delete`, `/api/account/export`. Risque de denial-of-wallet via l'API Mistral/OpenRouter. Fichiers concernes : `src/app/api/chat/route.ts`, `src/app/api/account/delete/route.ts`, `src/app/api/account/export/route.ts`.
- **Validation des payloads absente** : la taille des messages n'est pas limitee cote API (`src/app/api/chat/route.ts:28-29` verifie seulement que `messages` est un tableau). Un utilisateur pourrait envoyer un payload de taille arbitraire.
- **CSP avec `unsafe-inline` et `unsafe-eval`** (`next.config.mjs:13`) : la directive `script-src` inclut `'unsafe-inline' 'unsafe-eval'`, ce qui reduit l'efficacite de la CSP contre les attaques XSS. Necessaire pour Next.js en dev, mais a durcir avec des nonces en production.
- **Cles API en round-robin sans isolation** : le compteur `keyIndex` dans `src/lib/ai/mistral.ts:9` et `src/lib/ai/openrouter.ts:8` est un entier en memoire partage entre les requetes. Pas de probleme de securite direct, mais une fuite de cle impacterait toutes les requetes utilisant cette cle.

---

## 10. Mentions legales

**Pages:**
- `/privacy` -- politique de confidentialite (9 sections) : `src/app/(legal)/privacy/page.tsx`
- `/mentions-legales` -- editeur, hebergement, propriete intellectuelle : `src/app/(legal)/mentions-legales/page.tsx`

**Liens accessibles depuis:**
- Layout des pages auth (login, register, forgot-password) -- footer : `src/app/(auth)/layout.tsx:16-24`
- Sidebar du dashboard (quand depliee) -- bas de navigation : `src/components/sidebar.tsx:77-86`
- Bandeau cookies -- lien vers /privacy : `src/components/cookie-consent.tsx:29-34`
- Chat -- lien "En savoir plus" vers /privacy : `src/app/dashboard/chat/page.tsx:400`
- Page parametres -- lien vers /privacy : `src/app/dashboard/settings/page.tsx:286-289`

**Statut:** A CORRIGER

Le contenu de /privacy est incomplet : OpenRouter n'est pas mentionne comme sous-traitant. La table des sous-traitants (`src/app/(legal)/privacy/page.tsx:111-148`) ne liste que Supabase, Mistral AI et Vercel.

---

## 11. Bilan des corrections v2 -> v3

| # | Finding / Recommandation v2 | Priorite v2 | Statut v3 |
|---|---------------------------|-------------|-----------|
| 1 | Stocker le timestamp de consentement | Recommande | NON IMPLEMENTE |
| 2 | Rate limiting sur /api/chat | Recommande | NON IMPLEMENTE |
| 3 | Mentionner OpenRouter dans /privacy | Recommande | NON IMPLEMENTE (devenu CRITIQUE car OpenRouter est actif) |
| 4 | Purge automatique des comptes inactifs | Recommande | NON IMPLEMENTE |
| 5 | DPA avec Mistral AI | Administratif | NON FAIT |
| 6 | DPA avec Supabase | Administratif | NON FAIT |
| 7 | Verifier localisation serveurs Mistral | Administratif | NON FAIT |
| 8 | Designer un contact DPO | Administratif | NON FAIT |

**Nouveaux findings v3 :**

| # | Finding | Priorite |
|---|---------|----------|
| N1 | OpenRouter actif sans mention dans /privacy ni information utilisateur | BLOQUANT |
| N2 | Texte chat "Mistral AI" incorrect pour modeles OpenRouter | BLOQUANT |
| N3 | Table prompts absente de l'export de donnees | HAUTE |
| N4 | Table prompts : cascade ON DELETE non confirmee | HAUTE |
| N5 | Table prompts : RLS non confirmee | HAUTE |

---

## 12. Conformite par article RGPD

| Article | Sujet | v2 | v3 | Commentaire v3 |
|---------|-------|----|----|----------------|
| 5 | Principes de traitement | CONFORME | CONFORME | Conservation definie, finalites documentees |
| 6 | Base legale | CONFORME | CONFORME | Contrat + consentement |
| 7 | Conditions du consentement | CONFORME | A CORRIGER | Pas de timestamp, consentement ne couvre pas OpenRouter |
| 12 | Transparence | CONFORME | NON CONFORME | Politique de confidentialite incomplete (OpenRouter absent) |
| 13 | Information a la collecte | CONFORME | NON CONFORME | Chat desinforme sur le provider reel quand OpenRouter est utilise |
| 15 | Droit d'acces | CONFORME | PARTIEL | Export incomplet (prompts manquants) |
| 16 | Droit de rectification | CONFORME | CONFORME | Modification profil + email dans parametres |
| 17 | Droit a l'effacement | CONFORME | PARTIEL | Cascade prompts non confirmee |
| 20 | Droit a la portabilite | CONFORME | PARTIEL | Export incomplet (prompts manquants) |
| 25 | Protection par defaut | CONFORME | A VERIFIER | RLS prompts non confirmee, pas de rate limiting |
| 32 | Securite | CONFORME | PARTIEL | Pas de rate limiting, pas de validation payload, RLS prompts incertain |
| 44-49 | Transferts hors UE | A VERIFIER | NON CONFORME | OpenRouter (US) sans base legale documentee, sans information utilisateur |

---

## 13. Recommandations pour la v4

### Bloquant (a corriger immediatement)

1. **Ajouter OpenRouter dans la politique de confidentialite** -- Completer la section 4 "Destinataires des donnees" et la section 5 "Sous-traitants" de `/privacy` avec OpenRouter (societe americaine, transfert hors UE). Fichier : `src/app/(legal)/privacy/page.tsx`.
2. **Corriger le texte informatif du chat** -- Le texte "Vos messages sont traites par Mistral AI" doit indiquer le provider reel en fonction du modele selectionne (Mistral ou OpenRouter). Fichier : `src/app/dashboard/chat/page.tsx:390-403`.
3. **Verifier et corriger la table `prompts`** -- Confirmer dans Supabase que :
   - RLS est active (`ALTER TABLE prompts ENABLE ROW LEVEL SECURITY`)
   - Des politiques RLS existent pour limiter l'acces au `user_id` courant
   - La colonne `user_id` a une contrainte `REFERENCES auth.users ON DELETE CASCADE`
   - Ajouter la definition dans `supabase/schema.sql`

### Recommande (non bloquant)

4. **Inclure les prompts dans l'export de donnees** -- Ajouter la table `prompts` dans `src/app/api/account/export/route.ts` aux cotes de profiles, conversations et messages.
5. **Stocker le timestamp de consentement** -- Ajouter `consent_given_at: new Date().toISOString()` dans les metadata du `signUp` (`src/app/(auth)/register/page.tsx:42-48`) pour piste d'audit (art. 7.1).
6. **Rate limiting sur les routes API** -- Implementer un rate limiting par utilisateur sur `/api/chat`, `/api/account/delete`, `/api/account/export`. Priorite sur `/api/chat` (risque financier via les API Mistral/OpenRouter).
7. **Validation des payloads** -- Limiter la taille du champ `messages` dans `/api/chat` (nombre de messages et taille du contenu). Fichier : `src/app/api/chat/route.ts`.
8. **Purge automatique** -- Definir et implementer une duree maximale de conservation des comptes inactifs.

### Administratif (hors perimetre technique)

9. **Signer un DPA avec OpenRouter** -- Obligatoire pour les transferts de donnees personnelles (art. 28 RGPD). Inclure des clauses contractuelles types (art. 46) pour les transferts hors UE.
10. **Signer un DPA avec Mistral AI** -- Toujours en cours de formalisation selon /privacy.
11. **Signer un DPA avec Supabase** -- Supabase propose un DPA standard sur demande.
12. **Designer un contact DPO** -- Mentionner une adresse de contact dediee dans la politique de confidentialite (actuellement seulement contact@challenge48h.fr).
13. **Evaluer la base legale pour les transferts vers OpenRouter** -- Clauses contractuelles types, decision d'adequation, ou autre mecanisme conforme aux articles 44-49.
