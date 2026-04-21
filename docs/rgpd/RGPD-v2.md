# Audit RGPD — v2

Date: 2026-03-28
Audit precedent: RGPD-v1.md (meme date, score 4/10)

## 1. Synthese

Depuis la v1, toutes les corrections de priorite immediate et haute ont ete implementees. L'application dispose desormais d'une politique de confidentialite complete, d'un consentement explicite a l'inscription, d'une information sur le transfert vers Mistral, d'une suppression de compte reelle, d'un export de donnees et d'une API protegee.

Niveau de conformite estime: **8/10**

Points resolus depuis la v1:
- Politique de confidentialite complete (/privacy)
- Mentions legales (/mentions-legales)
- Consentement explicite a l'inscription (checkbox + lien)
- Information sur le transfert Mistral dans le chat
- Suppression complete du compte (auth.users via admin API)
- Export de donnees au format JSON
- API chat protegee par authentification
- Bandeau cookies simplifie et coherent
- En-tetes de securite (CSP, X-Frame-Options, etc.)
- Liens legaux dans le layout auth et la sidebar

Points restants:
- Pas de DPA formel avec Mistral / Supabase (hors perimetre technique)
- Pas de timestamp de consentement stocke
- Pas de rate limiting sur l'API
- Pas de politique de retention automatisee

---

## 2. Donnees personnelles collectees

*Inchange depuis la v1.*

### Donnees stockees (Supabase — region EU Frankfurt)

| Table | Champs personnels | Base legale |
|-------|-------------------|-------------|
| auth.users | email, mot de passe (hashe), metadata | Execution du contrat |
| profiles | email, nom complet, avatar_url | Execution du contrat |
| conversations | user_id, titre (extrait du message) | Interet legitime |
| messages | contenu integral des echanges | Interet legitime |

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

### Mistral AI — CORRIGE (etait CRITIQUE en v1)

**Donnees transmises:** historique de conversation, prompt systeme, modele selectionne.

**Corrections appliquees:**
- L'utilisateur est informe dans le chat : "Vos messages sont traites par Mistral AI" avec lien vers /privacy
- La politique de confidentialite detaille le transfert (section 4)
- Mention explicite : les donnees du plan gratuit peuvent etre utilisees pour l'entrainement des modeles
- Le consentement est recueilli a l'inscription via la checkbox politique de confidentialite

**Point restant:**
- Pas de DPA (Data Processing Agreement) formel signe avec Mistral — ceci est une demarche administrative, pas technique

### OpenRouter (nouveau depuis v1)

**Donnees transmises:** historique de conversation (meme pattern que Mistral).

**Statut:** Couvert par la meme architecture que Mistral. La politique de confidentialite mentionne les services tiers de maniere generique. A preciser dans /privacy si OpenRouter est utilise en production.

### Google Fonts — NON CRITIQUE

*Inchange.* Next.js self-host les polices au build. Aucune requete vers Google en runtime.

---

## 4. Consentement cookies — CORRIGE (etait NON CONFORME en v1)

**Fichier:** `src/components/cookie-consent.tsx`

**Etat actuel:**
- Bandeau informatif avec un seul bouton "Compris"
- Texte clair : "Ce site utilise uniquement des cookies essentiels a l'authentification"
- Lien vers la politique de confidentialite
- Choix stocke dans localStorage (cle: `cookie-notice-dismissed`)

**Verdict:** Conforme. Les cookies utilises sont strictement necessaires (auth Supabase) et ne requierent pas de consentement prealable selon le RGPD. Le bandeau est informatif, pas un recueil de consentement — c'est l'approche correcte.

---

## 5. Inscription et information — CORRIGE (etait NON CONFORME en v1)

**Fichier:** `src/app/(auth)/register/page.tsx`

**Corrections appliquees:**
- Checkbox obligatoire : "J'accepte la politique de confidentialite"
- Lien vers /privacy (ouvre dans un nouvel onglet)
- Bouton "Creer mon compte" desactive tant que la checkbox n'est pas cochee
- Liens vers /privacy et /mentions-legales dans le layout auth (footer)

**Point d'amelioration possible:**
- Stocker un timestamp `consent_given_at` dans les metadata Supabase pour piste d'audit. Non bloquant mais recommande.

---

## 6. Droit a l'effacement (article 17) — CORRIGE (etait PARTIEL en v1)

**Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/delete/route.ts`, `src/lib/supabase/admin.ts`

**Corrections appliquees:**
- Route API DELETE `/api/account/delete` avec verification de session
- Utilisation de `admin.auth.admin.deleteUser(user.id)` via service_role
- La suppression de `auth.users` declenche les cascades SQL :
  - `profiles` (ON DELETE CASCADE depuis auth.users)
  - `conversations` (ON DELETE CASCADE depuis auth.users via user_id)
  - `messages` (ON DELETE CASCADE depuis conversations via conversation_id)
- Deconnexion et redirection apres suppression
- Gestion d'erreur avec message utilisateur

**Point restant:**
- Les donnees deja transmises a Mistral ne sont pas recuperables. Mentionne dans la politique de confidentialite (section 4, avertissement).

---

## 7. Droit d'acces et portabilite (articles 15 et 20) — CORRIGE (etait NON CONFORME en v1)

**Fichiers:** `src/app/dashboard/settings/page.tsx`, `src/app/api/account/export/route.ts`

**Corrections appliquees:**
- Route API GET `/api/account/export` avec verification de session
- Export complet : profil + conversations + messages structures
- Format JSON lisible avec indentation
- Header `Content-Disposition: attachment; filename="mes-donnees.json"`
- Bouton "Exporter mes donnees" dans la page parametres
- Telechargement automatique via blob URL

**Verdict:** Conforme. L'utilisateur peut obtenir une copie complete de ses donnees en un clic.

---

## 8. Duree de conservation — PARTIELLEMENT CORRIGE

**Etat actuel:**
- La politique de confidentialite indique : "Vos donnees sont conservees tant que votre compte est actif. En cas de suppression, toutes vos donnees sont definitivement supprimees."
- Pas de mecanisme de purge automatique apres inactivite

**Verdict:** Acceptable pour un MVP. La duree est definie (vie du compte) et documentee. Un mecanisme de purge automatique serait un plus pour la v3 mais n'est pas bloquant.

---

## 9. Securite des donnees (article 32) — CORRIGE (etait PARTIEL en v1)

### Points positifs (inchanges depuis v1)
- RLS active sur toutes les tables
- Mots de passe hashes par Supabase (bcrypt)
- Session via cookies HTTP-only
- HTTPS via Supabase
- Aucun script de tracking ou analytics

### Corrections appliquees

| Point v1 | Statut v2 |
|----------|-----------|
| API chat accessible sans auth | CORRIGE — verification session obligatoire, 401 si non authentifie |
| Aucun en-tete de securite | CORRIGE — CSP, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy |
| Middleware non fonctionnel (proxy.ts) | CORRIGE — middleware.ts avec export correct |

### Points restants
- **Rate limiting** — pas encore implemente. Risque de denial-of-wallet si un utilisateur authentifie abuse de l'API. Recommande pour la v3.
- **Validation des payloads** — la taille des messages n'est pas limitee cote API. Point mineur.

---

## 10. Mentions legales — CORRIGE (etait NON CONFORME en v1)

**Pages creees:**
- `/privacy` — politique de confidentialite complete (8 sections)
- `/mentions-legales` — editeur, hebergement, propriete intellectuelle, renvoi vers /privacy

**Liens accessibles depuis:**
- Layout des pages auth (login, register, forgot-password) — footer
- Sidebar du dashboard (quand depliee) — bas de navigation
- Bandeau cookies — lien vers /privacy
- Chat — lien "En savoir plus" vers /privacy
- Page parametres — lien vers /privacy

**Verdict:** Conforme. Les pages legales sont accessibles depuis tous les points cles de l'application.

---

## 11. Bilan des corrections v1 → v2

| # | Finding v1 | Priorite v1 | Statut v2 |
|---|-----------|-------------|-----------|
| 1 | Politique de confidentialite absente | IMMEDIATE | CORRIGE |
| 2 | Pas de consentement a l'inscription | IMMEDIATE | CORRIGE |
| 3 | Transfert Mistral non mentionne | IMMEDIATE | CORRIGE |
| 4 | Suppression de compte incomplete | IMMEDIATE | CORRIGE |
| 5 | Pas d'export de donnees | HAUTE | CORRIGE |
| 6 | API chat non protegee | HAUTE | CORRIGE |
| 7 | Bandeau cookies cosmetique | HAUTE | CORRIGE |
| 8 | Pas d'en-tetes de securite | MOYENNE | CORRIGE |
| 9 | Pas de politique de retention | MOYENNE | PARTIELLEMENT CORRIGE (documentee, pas automatisee) |
| 10 | Mentions legales absentes | MOYENNE | CORRIGE |

---

## 12. Conformite par article RGPD — v2

| Article | Sujet | v1 | v2 | Commentaire v2 |
|---------|-------|----|----|----------------|
| 5 | Principes de traitement | PARTIEL | CONFORME | Conservation definie, finalites documentees |
| 6 | Base legale | PARTIEL | CONFORME | Contrat + consentement explicite |
| 7 | Conditions du consentement | NON CONFORME | CONFORME | Checkbox a l'inscription, lien vers /privacy |
| 12 | Transparence | NON CONFORME | CONFORME | Politique de confidentialite complete |
| 13 | Information a la collecte | NON CONFORME | CONFORME | Information a l'inscription + mention chat |
| 15 | Droit d'acces | NON CONFORME | CONFORME | Export JSON complet |
| 17 | Droit a l'effacement | PARTIEL | CONFORME | Suppression auth.users + cascades |
| 20 | Droit a la portabilite | NON CONFORME | CONFORME | Export JSON telechargeable |
| 25 | Protection par defaut | PARTIEL | CONFORME | API protegee, RLS, middleware |
| 32 | Securite | PARTIEL | CONFORME | Headers securite, CSP, auth API |
| 44-49 | Transferts hors UE | A VERIFIER | A VERIFIER | Localisation Mistral a confirmer, DPA a signer |

---

## 13. Recommandations pour la v3

### Recommande (non bloquant)

1. **Stocker le timestamp de consentement** — ajouter `consent_given_at` dans les metadata du `signUp` pour piste d'audit
2. **Rate limiting sur `/api/chat`** — limiter le nombre de requetes par utilisateur/minute
3. **Mentionner OpenRouter** dans la politique de confidentialite si utilise en production
4. **Purge automatique** — supprimer les comptes inactifs apres X mois (avec notification prealable)

### Administratif (hors perimetre technique)

5. **Signer un DPA avec Mistral AI** — obligatoire si les donnees sont traitees pour le compte du responsable
6. **Signer un DPA avec Supabase** — Supabase propose un DPA standard sur demande
7. **Verifier la localisation des serveurs Mistral** — confirmer que le traitement reste dans l'UE ou sous clauses contractuelles types
8. **Designer un contact DPO** — mentionner une adresse de contact dans la politique de confidentialite
