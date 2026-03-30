"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MoreHorizontal, Calendar, MessageSquare } from "lucide-react";

const mockTasks = {
  todo: [
    { id: 1, title: "Créer le schéma Supabase", desc: "Ajouter les tables projects et tasks", priority: "High", deadline: "Aujourd'hui" },
    { id: 2, title: "Setup le serveur MCP", desc: "Exposer les tools pour l'IA", priority: "Medium", deadline: "Demain" },
    { id: 5, title: "test", desc: "ia", priority: "Low", deadline: "04/04" },
  ],
  inProgress: [
    { id: 3, title: "UI du Kanban", desc: "Créer les colonnes et les cartes", priority: "High", deadline: "aujourd'hui" },
  ],
  done: [
    { id: 4, title: "Authentification", desc: "Login, Register, Mot de passe oublié", priority: "Low", deadline: "Terminé" },
  ]
};

export default function KanbanPage() {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Challenge 48H App</h1>
          <p className="text-muted-foreground">Développement de l'application de gestion de projet avec IA.</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">N</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8 border-2 border-background -ml-3">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">E</AvatarFallback>
          </Avatar>
          <Button size="sm" className="ml-4">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle tâche
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        
        <div className="flex w-80 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-muted-foreground">À FAIRE <Badge variant="secondary" className="ml-2">{mockTasks.todo.length}</Badge></h3>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          {mockTasks.todo.map(task => <TaskCard key={task.id} task={task} />)}
          <Button variant="ghost" className="w-full justify-start text-muted-foreground"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
        </div>

        <div className="flex w-80 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary">EN COURS <Badge className="ml-2">{mockTasks.inProgress.length}</Badge></h3>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          {mockTasks.inProgress.map(task => <TaskCard key={task.id} task={task} />)}
        </div>

        <div className="flex w-80 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-green-600 dark:text-green-400">TERMINÉ <Badge variant="outline" className="ml-2">{mockTasks.done.length}</Badge></h3>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          {mockTasks.done.map(task => <TaskCard key={task.id} task={task} />)}
        </div>

      </div>
    </div>
  );
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "High":
      return "bg-accent text-accent-foreground hover:bg-accent/80 border-transparent";
    case "Medium":
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent";
    case "Low":
      return "bg-primary/20 text-primary hover:bg-primary/30 border-transparent";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TaskCard({ task }: { task: any }) {
  return (
    <Card className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Badge className={`text-[10px] ${getPriorityClasses(task.priority)}`}>
            {task.priority}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium text-sm leading-none mb-1">{task.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{task.desc}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <Calendar className="h-3 w-3" />
            <span>{task.deadline}</span>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">E</AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  );
}