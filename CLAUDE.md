# Challenge 48h

## Stack
- Next.js 14+ (App Router)
- TypeScript strict
- Tailwind CSS + shadcn/ui pour tout composant UI
- Supabase (auth, BDD, storage)
- Mistral AI pour le chat IA

## Règles ABSOLUES
- JAMAIS mentionner Claude, Anthropic, IA, AI dans le code, commentaires, commits, noms de fichiers ou branches
- Pas de Co-authored-by dans les commits
- Ne fais JAMAIS de git commit toi-même, je commite manuellement
- Code et commentaires en anglais, UI en français
- Utilise shadcn/ui pour TOUT composant (boutons, inputs, modals, tables, etc.)

## Conventions
- Un composant = un fichier
- Logique Supabase isolée dans /lib/supabase/
- Logique Mistral isolée dans /lib/ai/
- Types dans /types/
- Variables d'env dans .env.local (jamais hardcodées)

## RGPD
- Consentement cookies obligatoire
- Bouton suppression de compte
- Pas de tracking externe
- Données stockées en EU (Supabase region Frankfurt)