"use client";

import { BADGES, type UserStats } from "@/lib/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Rocket, Zap, FolderCheck, Shield, Crown, Award } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  zap: Zap,
  "folder-check": FolderCheck,
  shield: Shield,
  crown: Crown,
};

interface BadgesGridProps {
  stats: UserStats;
  unlockDates?: Record<string, string>;
}

export function BadgesGrid({ stats, unlockDates = {} }: BadgesGridProps) {
  const unlockedIds = new Set(
    BADGES.filter((b) => b.check(stats)).map((b) => b.id)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Badges ({unlockedIds.size}/{BADGES.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 flex-wrap">
          <TooltipProvider>
            {BADGES.map((badge) => {
              const unlocked = unlockedIds.has(badge.id);
              const Icon = ICON_MAP[badge.icon] || Rocket;

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger
                    render={<div />}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all w-[90px] ${
                        unlocked
                          ? "bg-primary/5 border-primary/20 shadow-sm"
                          : "bg-muted/30 border-transparent opacity-40 grayscale"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          unlocked
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">
                        {badge.name}
                      </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-medium">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                    {unlocked && unlockDates[badge.id] ? (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Débloqué le{" "}
                        {new Date(unlockDates[badge.id]).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    ) : !unlocked ? (
                      <p className="text-xs text-amber-500 mt-0.5">Non débloqué</p>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
