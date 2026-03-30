# Audit RGPD — v1

Date: 2026-03-28

## 1. Synthese

L'application collecte des donnees personnelles (email, nom, conversations) et les transmet a un service tiers (Mistral). La base de securite est correcte (RLS, hachage mot de passe, pas de tracking) mais plusieurs obligations RGPD ne sont pas remplies.

Niveau de conformite estime: **4/10**

Points critiques:
- Aucune politique de confidentialite
- Consentement cookies non fonctionnel
- Transfert de donnees vers Mistral sans information ni consentement
- Suppression de compte incomplete
- Pas de mention legale a l'inscription

---

## 2. Donnees personnelles collectees

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
| cookie-consent | "accepted" ou "refused" | Aucune (pas de PII) |
| theme | "light" ou "dark" | Aucune |

### Cookies

| Cookie | Origine | Type | Consentement requis |
|--------|---------|------|---------------------|
| sb-*-auth-token | Supabase SSR | Session/auth (essentiel) | Non (strictement necessaire) |

---

## 3. Transferts vers des tiers

### Mistral AI (CRITIQUE)

**Donnees transmises:**
- Integralite de l'historique de conversation (messages user + assistant)
- Prompt systeme
- Modele selectionne

**Problemes:**
- Aucun consentement utilisateur avant envoi
- Aucune mention que les messages sont transmis a un tiers
- Pas de DPA (Data Processing Agreement) visible
- Selon les CGU Mistral (plan gratuit): "Les donnees d'entree/sortie peuvent etre utilisees pour entrainer les modeles"
- Aucune anonymisation des messages
- Aucune limitation du volume de donnees transmises

**Fichiers concernes:**
- `src/app/api/chat/route.ts` — envoie tout l'historique
- `src/lib/ai/mistral.ts` — appel direct a l'API Mistral

### Google Fonts (MINEUR)

**Donnees transmises:**
- URL de la page (referrer)
- IP de l'utilisateur

**Probleme:**
- `next/font/google` est utilise dans `src/app/layout.tsx`
- Next.js optimise et self-host les polices en build, donc ce point est **non critique** si le build est fait correctement

---

## 4. Consentement cookies

**Fichier:** `src/components/cookie-consent.tsx`

**Etat actuel:**
- Bandeau affiche avec boutons "Accepter" / "Refuser"
- Choix stocke dans localStorage
- Le choix n'est **jamais lu ni applique** ailleurs dans l'application
- Les cookies Supabase auth sont poses **avant** tout consentement

**Verdict:** Le consentement est purement cosmetique. Il ne bloque ni n'autorise rien.

**Correction necessaire:**
- Les cookies d'authentification Supabase sont strictement necessaires au fonctionnement → pas besoin de consentement pour ceux-la
- Le bandeau devrait clairement indiquer qu'il s'agit uniquement de cookies essentiels
- Si aucun cookie non-essentiel n'est utilise, le bandeau peut etre simplifie en simple information (pas de refus necessaire)
- Ajouter un lien vers la politique de confidentialite

---

## 5. Inscription et information

**Fichier:** `src/app/(auth)/register/page.tsx`

**Donnees collectees:** nom complet, email, mot de passe

**Problemes:**
- Aucun lien vers une politique de confidentialite
- Aucune case a cocher pour accepter les CGU / politique de confidentialite
- Aucune mention de la finalite du traitement des donnees
- Aucune mention du transfert vers Mistral

**Obligation RGPD (article 13):** Au moment de la collecte, l'utilisateur doit etre informe de:
- L'identite du responsable de traitement
- Les finalites du traitement
- Les destinataires des donnees (Mistral)
- La duree de conservation
- Ses droits (acces, rectification, suppression, portabilite)

---

## 6. Droit a l'effacement (article 17)

**Fichier:** `src/app/dashboard/settings/page.tsx`

**Etat actuel:**
- Bouton "Supprimer mon compte" avec dialog de confirmation
- Supprime la ligne `profiles` → cascade vers `conversations` → cascade vers `messages`
- Deconnexion apres suppression

**Problemes:**
- Le compte `auth.users` Supabase n'est **PAS supprime**
- L'utilisateur peut potentiellement se reconnecter
- Les donnees deja envoyees a Mistral ne sont pas supprimables
- Aucune confirmation par email avant suppression

**Correction necessaire:**
- Utiliser l'Admin API Supabase (service_role) pour supprimer le compte auth
- Informer l'utilisateur que les donnees transmises a Mistral ne peuvent pas etre recuperees

---

## 7. Droit d'acces et portabilite (articles 15 et 20)

**Etat actuel:** Non implemente.

**Obligation:**
- L'utilisateur doit pouvoir obtenir une copie de toutes ses donnees
- L'utilisateur doit pouvoir exporter ses donnees dans un format lisible (JSON, CSV)

**Correction necessaire:**
- Ajouter un bouton "Exporter mes donnees" dans les parametres
- Generer un export contenant: profil, conversations, messages

---

## 8. Duree de conservation

**Etat actuel:** Aucune politique de retention definie.

**Problemes:**
- Les conversations et messages sont conserves indefiniment
- Pas de suppression automatique apres une periode d'inactivite
- Pas de mention de duree dans l'interface

**Correction necessaire:**
- Definir une duree de conservation (ex: 12 mois d'inactivite)
- Informer l'utilisateur de cette duree
- Implementer un mecanisme de purge automatique (optionnel)

---

## 9. Securite des donnees (article 32)

### Points positifs
- RLS active sur toutes les tables — chaque utilisateur accede uniquement a ses donnees
- Mots de passe hashes par Supabase (bcrypt)
- Session via cookies HTTP-only
- Middleware de protection des routes `/dashboard`
- HTTPS via Supabase
- Aucun script de tracking ou analytics

### Points faibles
- **API `/api/chat` accessible sans authentification** — n'importe qui peut consommer les cles Mistral
- **Aucun rate limiting** — risque de denial-of-wallet
- **Aucun en-tete de securite** dans `next.config.mjs` (pas de CSP, pas de X-Frame-Options, pas de Referrer-Policy)
- **Pas de validation stricte** des payloads cote API
- **Rotation des cles API** sans journalisation

---

## 10. Mentions legales absentes

L'application ne contient aucune des pages suivantes:
- Politique de confidentialite
- Conditions generales d'utilisation
- Mentions legales

Ces pages sont **obligatoires** pour tout service collectant des donnees personnelles dans l'UE.

---

## 11. Plan de remediation

### Priorite immediate (bloquant RGPD)

1. **Creer une page politique de confidentialite** (`/privacy`)
   - Identite du responsable de traitement
   - Finalites: authentification, chat avec service tiers
   - Destinataires: Supabase (hebergement), Mistral (traitement des messages)
   - Duree de conservation
   - Droits de l'utilisateur
   - Contact DPO ou responsable

2. **Ajouter consentement a l'inscription**
   - Case a cocher: "J'accepte la politique de confidentialite"
   - Lien vers `/privacy`

3. **Informer sur le transfert Mistral**
   - Mention visible dans le chat: "Vos messages sont traites par Mistral AI"
   - Ou dans la politique de confidentialite avec renvoi depuis le chat

4. **Corriger la suppression de compte**
   - Supprimer egalement le compte `auth.users`
   - Via une route API utilisant la service_role key de Supabase

### Priorite haute

5. **Ajouter l'export de donnees**
   - Bouton dans les parametres → telecharge un JSON avec profil + conversations + messages

6. **Proteger l'API chat par authentification**
   - Verifier la session Supabase dans `/api/chat`

7. **Simplifier le bandeau cookies**
   - Remplacer par une simple information (cookies essentiels uniquement)
   - Ajouter lien vers politique de confidentialite

### Priorite moyenne

8. **Ajouter les en-tetes de securite**
   - CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options

9. **Definir une politique de retention des donnees**
   - Duree maximale de conservation
   - Mecanisme de purge

10. **Ajouter une page mentions legales** (`/legal`)

---

## 12. Conformite par article RGPD

| Article | Sujet | Statut | Commentaire |
|---------|-------|--------|-------------|
| 5 | Principes de traitement | PARTIEL | Pas de minimisation, pas de limitation de conservation |
| 6 | Base legale | PARTIEL | Execution du contrat pour auth, manque consentement pour Mistral |
| 7 | Conditions du consentement | NON CONFORME | Pas de consentement explicite pour le traitement par Mistral |
| 12 | Transparence | NON CONFORME | Aucune politique de confidentialite |
| 13 | Information a la collecte | NON CONFORME | Aucune information fournie a l'inscription |
| 15 | Droit d'acces | NON CONFORME | Pas d'export de donnees |
| 17 | Droit a l'effacement | PARTIEL | Suppression incomplete (auth.users reste) |
| 20 | Droit a la portabilite | NON CONFORME | Pas d'export |
| 25 | Protection par defaut | PARTIEL | RLS OK, mais API non protegee |
| 32 | Securite | PARTIEL | Bonne base, manque headers et rate limiting |
| 44-49 | Transferts hors UE | A VERIFIER | Localisation serveurs Mistral a confirmer |
