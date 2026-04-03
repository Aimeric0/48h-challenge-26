"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";
import { getLevelTitle } from "@/lib/gamification";

interface LeaderboardUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  xp: number;
  level: number;
}

interface GlobalLeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RANK_ICONS = [
  { icon: Trophy, color: "text-amber-500" },
  { icon: Medal, color: "text-slate-400" },
  { icon: Medal, color: "text-amber-700" },
];

export function GlobalLeaderboard({ users, currentUserId }: GlobalLeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Classement global
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun utilisateur pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => {
              const RankIcon = RANK_ICONS[index];
              const isCurrentUser = user.id === currentUserId;

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isCurrentUser ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-6 shrink-0">
                    {RankIcon ? (
                      <RankIcon.icon className={`h-4 w-4 ${RankIcon.color}`} />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(user.full_name || user.email)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + title */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || user.email}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">(vous)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getLevelTitle(user.level)}
                    </p>
                  </div>

                  {/* Level badge */}
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Niv. {user.level}
                  </Badge>

                  {/* XP */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-medium">{user.xp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
