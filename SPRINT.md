# SPRINT — Ce qu'il reste a faire

## Etat global : ~80% termine

Le socle obligatoire (55 pts) est **100% complet**. Il reste des bonus et du polish.

---

## SOCLE OBLIGATOIRE (55 pts) — TERMINE

| Fonctionnalite | Statut | Points |
|----------------|--------|--------|
| Auth (inscription/connexion email+mdp) | FAIT | /30 |
| CRUD Projets + invitation membres | FAIT | /30 |
| CRUD Taches + assignation + statuts + deadlines | FAIT | /30 |
| Board Kanban (drag & drop) | FAIT | /30 |
| Dashboard (progression, taches en retard) | FAIT | /30 |
| MCP Tools (list_projects, list_tasks, create_task, update_task, get_project_summary) | FAIT | /25 |
| MCP Resource (project://<id>) | FAIT | /25 |
| MCP Prompt (standup) | FAIT | /25 |

---

## BONUS — EN COURS / MANQUANT

### Gamification (partiellement fait)
- [x] Systeme XP (10 XP par tache completee, 50 XP par projet)
- [x] Systeme de niveaux avec titres
- [x] Composant XpBar dans le header
- [ ] **Badges** — pas de schema DB ni d'UI
- [ ] **Streaks** (series de jours actifs) — pas implemente
- [ ] **Leaderboard equipe** — pas implemente

### Notifications intelligentes (pas fait)
- [ ] Integration Resend pour envoi d'emails
- [ ] Rappels de deadlines automatiques
- [ ] Alertes d'inactivite
- [ ] Notifications in-app (cloche + historique)

### Integration Git (pas fait)
- [ ] Webhooks GitHub pour lier commits/PRs aux taches
- [ ] Auto-passage en "Done" sur merge de PR
- [ ] UI d'affichage des commits lies

---

## UX/DESIGN (15 pts) — A VERIFIER

- [x] Charte graphique (violet primary, amber secondary, pink accent, warm cream bg)
- [x] Composants shadcn/ui partout
- [x] Dark mode
- [x] Responsive
- [x] UI en francais
- [ ] Verifier la coherence visuelle globale
- [ ] Verifier les etats vides / messages d'erreur

---

## LIVRABLES — A PREPARER

- [x] Application fonctionnelle en local
- [ ] **README detaille** — verifier qu'il est complet et a jour
- [ ] **Demo live** — preparer un scenario de demo
- [ ] **Pitch 10 min** — preparer les slides
- [ ] **Formulaire de fin** — a completer

---

## PRIORITES RECOMMANDEES (par impact/effort)

1. **Gamification : badges + streaks** — bonus facile a scorer, schema DB + UI simple
2. **Dashboard : activite recente** — petite amelioration visible pour le jury
3. **README** — livrable obligatoire, doit etre impeccable
4. **Notifications in-app** — plus simple que les emails, bonne impression
5. **Demo scenario** — preparer un parcours fluide pour le pitch
