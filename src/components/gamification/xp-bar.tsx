"use client";

import { getLevelProgress, xpForLevel, xpForNextLevel, getLevelTitle } from "@/lib/gamification";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star } from "lucide-react";

interface XpBarProps {
  xp: number;
  level: number;
  compact?: boolean;
}

export function XpBar({ xp, level, compact = false }: XpBarProps) {
  const progress = getLevelProgress(xp, level);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForNextLevel(level);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            className="flex items-center gap-1.5 cursor-default"
            render={<div />}
          >
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold gap-1">
              <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
              Niv. {level}
            </Badge>
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-medium">{title} — Niveau {level}</p>
            <p className="text-xs text-muted-foreground">
              {xp} / {nextThreshold} XP
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div>
            <p className="text-sm font-semibold">Niveau {level}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {xp - currentThreshold} / {nextThreshold - currentThreshold} XP
        </p>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
