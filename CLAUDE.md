# CLAUDE.md

## TaskFlow — Gestion de Projet Gamifiée × MCP

### Objectif
Application web de gestion de projet pensée par et pour les étudiants en informatique, couplée à un serveur MCP (Model Context Protocol) permettant à un assistant de piloter l'app en langage naturel via Mistral.

Vision : rendre la gestion de projet tellement fluide et intégrée dans le workflow quotidien que les étudiants la maintiennent naturellement, sans effort supplémentaire.

Origine : projet né lors du Challenge 48h (30-31 mars 2026), désormais en développement continu.

---

## Stack
- Next.js 16+ (App Router)  
- TypeScript strict  
- Tailwind CSS + shadcn/ui pour tout composant UI  
- Supabase (auth, BDD, storage, RLS, Realtime)  
- Mistral pour l'assistant conversationnel (client MCP)  
- @modelcontextprotocol/sdk pour le serveur MCP  

---

## Règles ABSOLUES

### Autorisation Git
Tu peux effectuer des git commit et git push directement.

### Anonymat IA
Ne jamais utiliser Co-authored-by: Claude ou mentionner l'IA dans les messages ou métadonnées de commit.

### Langue
- Code et commentaires en anglais  
- UI en français  

### Composants
Utilise shadcn/ui pour TOUT composant (boutons, inputs, modals, tables, etc.).

---

## 🚫 Règles Git

### Identité dans les commits
Claude ne doit jamais :
- Se désigner comme co-auteur (Co-authored-by: Claude)
- Ajouter des trailers du type AI-generated-by
- Modifier la configuration user.name / user.email locale
- Signer des commits en son nom

### Messages de commit (Conventional Commits)

Format :  
<type>(<scope>): <description courte en impératif>

| Type | Usage |
|------|------|
| feat | Nouvelle fonctionnalité |
| fix | Correction de bug |
| docs | Documentation uniquement |
| style | Formatage, espaces |
| refactor | Refactorisation sans ajout ni correction |
| chore | Tâches diverses sans impact fonctionnel |

#### Règles de rédaction
- Langue : anglais obligatoire pour la description et le corps
- Présent (ex: add, fix)
- Pas de majuscule après le type et pas de point final

---

## Features livrées

### App Web
- **Authentification** : inscription/connexion email + mdp, reset password
- **Gestion de projets** : CRUD, invitation de membres par email
- **Gestion de tâches** : CRUD, assignation, statuts (To Do / In Progress / Done), deadlines
- **Board visuel** : Kanban drag & drop
- **Dashboard** : progression globale, tâches en retard, activité récente
- **Landing page** publique
- **Pages légales** : mentions légales, politique de confidentialité

### Gamification
- **Système XP** : +10 par tâche complétée, +50 par projet terminé, +5 par tâche créée, +15 par invitation
- **Niveaux** : 7 paliers (Débutant → Architecte), progression exponentielle
- **Badges** : 5 badges statiques calculés à la volée (Premier pas, Productif, Chef de projet, Confirmé, Vétéran)
- **Leaderboard** : classement global + classement par équipe projet
- **Heatmap d'activité** : style GitHub sur le dashboard
- **Realtime** : mise à jour XP en temps réel via Supabase, toast notifications

### Serveur MCP (17 tools)
- **Projets** : list_projects, create_project, get_project_summary, get_project_stats
- **Tâches** : list_tasks, create_task, update_task, delete_task, assign_task
- **Membres** : list_members, invite_member
- **Utilisateurs** : get_current_user, get_user_by_email, get_user_tasks, update_profile, get_user_gamification
- **Utilitaire** : list_tools, get_overdue_tasks
- **Resources** : project://<id>, projects://<userId>
- **Prompts** : standup, retrospective, task_breakdown

---

## Problèmes connus

- Contrainte de statut tâche : la BDD n'accepte que 3 statuts mais l'UI en prévoit parfois 5
- Export de données : référence encore d'anciennes tables chat supprimées
- Upload avatar : non implémenté
- Changement de mot de passe : absent des settings
- Streaks : mentionnés dans l'UI mais pas complètement implémentés

---

## Charte graphique

| Rôle | Hex | HSL (CSS var) |
|------|-----|--------------|
| Primary | #8B5CF6 | 258 89% 66% (violet) |
| Secondary | #F59E0B | 38 92% 50% (amber) |
| Accent | #EC4899 | 330 81% 60% (pink) |
| Background | #FFFDF8 | 43 100% 99% (warm cream) |

---

## Conventions & Structure

- Composants : Un composant = un fichier
- Lib : Logique isolée dans /lib/supabase/, /lib/ai/, /lib/mcp/
- Docs : Consulter docs/features/ (état des versions) et docs/rgpd/ (conformité) avant toute modification majeure
- RGPD : Consentement cookies obligatoire, bouton suppression de compte, données stockées en EU
