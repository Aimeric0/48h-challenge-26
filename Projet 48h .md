# **Dossier de Projet : Challenge 48H \- Gestion de Projet MCP**

Rennes Ynov Campus | 30 & 31 Mars 2026

## **1\. Introduction et Contexte**

### **1.1 Le Constat**

La gestion de projet traditionnelle est souvent perçue comme une contrainte par les étudiants en informatique (friction élevée, outils déconnectés du code, rythmes inadaptés). L'objectif est de créer une solution que les apprenants utilisent réellement.

### **1.2 La Mission**

Concevoir et développer une application web de gestion de projet couplée à un serveur **MCP (Model Context Protocol)**. Ce protocole permet à un assistant IA (comme Mistral ou Claude) d'interagir avec l'application en langage naturel pour fluidifier le workflow.

---

## **2\. Spécifications Fonctionnelles**

### **2.1 Socle Obligatoire (Application Web)**

* **Authentification :** Inscription et connexion via email/mot de passe avec gestion de profil.  
* **Gestion de projets :** Création de projets et invitation de membres.  
* **Gestion de tâches (CRUD) :** Créer, assigner, modifier le statut (To Do / In Progress / Done) et fixer des deadlines.  
* **Visualisation :** Tableau de bord (Board visuel) et dashboard synthétique de progression.

### **2.2 Intégration IA via Serveur MCP**

Le serveur expose les primitives suivantes pour permettre à l'IA d'agir sur l'application:

* **Tools (Actions) :**  
  * list\_projects / list\_tasks : Lister les éléments de l'utilisateur.  
  * create\_task : Créer une tâche avec titre, description et assignation.  
  * update\_task : Modifier le statut, l'assignation ou la deadline.  
  * assign\_task : Assigner spécifiquement une tâche à un membre.  
  * get\_project\_summary : Générer un résumé structuré des statistiques et tâches critiques.  
  * create\_notification : Rédaction automatique de notifications par l'IA.  
* **Resources (Lecture) :**  
  * project://\<id\> : Accès aux données complètes d'un projet pour analyse par l'IA.

### **2.3 Fonctionnalités Avancées (Bonus)**

* **Gamification :** Système de points d'XP, badges et streaks (séries de jours actifs) personnalisables pour encourager l'usage.  
* **Notifications Intelligentes :** Rappels de deadlines et alertes d'inactivité envoyés via **Resend** (limite de 3 000 mails/mois).  
* **Intégration Git :** Liaison des commits/PRs aux tâches avec automatisation du statut "Done". \- Intégration Github

---

## **3\. Stack Technique**

Le projet repose sur une stack moderne et performante:

| Catégorie | Technologie | Version |
| :---- | :---- | :---- |
| **Framework** | Next.js (App Router) | ^16.2.1 |
| **Langage** | TypeScript (strict) | ^5 |
| **UI Library** | React | ^18 |
| **Styling** | Tailwind CSS | ^3.4.1 |
| **Composants** | shadcn/ui \+ Radix UI | ^1.6.0 |
| **Backend / BDD** | Supabase (SSR) | ^2.100.0 |
| **Emailing** | Resend |  |
| **Documentation** | React-markdown \+ Remark-gfm | ^10.1.0 |

---

## 

## **4\. Organisation de l'Équipe**

* **Nathan (Techlead) :** Responsable Backend, intégration IA (MCP) et gestion de la base de données Supabase.  
* **Tyfenn :** Développement Backend et tests de l'application.  
* **Aimeric :** Développement Frontend et tests de l'interface.  
* **Enzo :** Développement Frontend et UX/UI.

---

## **5\. Critères de Succès et Livrables**

### **5.1 Évaluation**

Le projet sera noté sur 100 points, dont 30 points pour les fonctionnalités du socle, 25 points pour le serveur MCP et 15 points pour l'UX/Design.

5.2 Livrables Attendus

1. Application fonctionnelle en local avec démonstration live.  
2. Répertoire GitHub complet avec un README détaillé.  
3. Pitch de présentation (10 min) suivi d'une session de questions (10 min).  
4. Formulaire de fin de challenge complété.

