"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";
import { getLevelTitle, getLevelProgress, xpForNextLevel } from "@/lib/gamification";
import type { Profile, ProjectMember } from "@/types/database";

interface TeamLeaderboardProps {
  members: (ProjectMember & { profile: Profile })[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RANK_STYLES = [
  { icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10", ring: "ring-slate-400/30" },
  { icon: Medal, color: "text-amber-700", bg: "bg-amber-700/10", ring: "ring-amber-700/30" },
];

export function TeamLeaderboard({ members }: TeamLeaderboardProps) {
  const ranked = [...members]
    .filter((m) => m.profile)
    .sort((a, b) => b.profile.xp - a.profile.xp);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Classement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.map((member, index) => {
          const profile = member.profile;
          const rankStyle = RANK_STYLES[index];
          const progress = getLevelProgress(profile.xp, profile.level);
          const nextXp = xpForNextLevel(profile.level);

          return (
            <div
              key={member.user_id}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                index === 0 ? "bg-amber-500/5 ring-1 ring-amber-500/20" : "hover:bg-muted/50"
              }`}
            >
              {/* Rank */}
              <div className={`flex items-center justify-center h-7 w-7 rounded-full shrink-0 ${
                rankStyle ? `${rankStyle.bg}` : "bg-muted"
              }`}>
                {rankStyle ? (
                  <rankStyle.icon className={`h-3.5 w-3.5 ${rankStyle.color}`} />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={`text-xs ${
                  index === 0 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-primary/10 text-primary"
                }`}>
                  {getInitials(profile.full_name || profile.email)}
                </AvatarFallback>
              </Avatar>

              {/* Name + level */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">
                    {profile.full_name || profile.email}
                  </p>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal shrink-0">
                    Niv. {profile.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {getLevelTitle(profile.level)}
                  </span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold">{profile.xp}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
            </div>
          );
        })}

        {ranked.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun membre
          </p>
        )}
      </CardContent>
    </Card>
  );
}
