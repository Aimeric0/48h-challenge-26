"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity } from "lucide-react";

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 5) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
}

const DAYS_FR = ["Lun", "", "Mer", "", "Ven", "", ""];
const MONTHS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build a map of date -> count
  const countMap = new Map<string, number>();
  for (const d of data) {
    countMap.set(d.date, d.count);
  }

  // Generate last 16 weeks (112 days) of dates
  const weeks: { date: Date; dateStr: string; count: number }[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Monday of the current week
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const endMonday = new Date(today);
  endMonday.setDate(today.getDate() - mondayOffset);

  const totalWeeks = 16;
  const startDate = new Date(endMonday);
  startDate.setDate(startDate.getDate() - (totalWeeks - 1) * 7);

  for (let w = 0; w < totalWeeks; w++) {
    const week: { date: Date; dateStr: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      week.push({
        date,
        dateStr,
        count: date <= today ? (countMap.get(dateStr) ?? 0) : -1,
      });
    }
    weeks.push(week);
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS_FR[month], col: i });
      lastMonth = month;
    }
  });

  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Activité
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {totalActivities} action{totalActivities !== 1 ? "s" : ""} ces 16 dernières semaines
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-8">
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.col === i);
              return (
                <div key={i} className="w-[13px] shrink-0">
                  {label && (
                    <span className="text-[10px] text-muted-foreground">
                      {label.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1 shrink-0">
              {DAYS_FR.map((label, i) => (
                <div key={i} className="h-[13px] flex items-center">
                  <span className="text-[10px] text-muted-foreground w-6 text-right">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <TooltipProvider delay={100}>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      if (day.count === -1) {
                        return (
                          <div
                            key={day.dateStr}
                            className="h-[13px] w-[13px] rounded-sm"
                          />
                        );
                      }
                      return (
                        <Tooltip key={day.dateStr}>
                          <TooltipTrigger
                            render={<div />}
                            className={`h-[13px] w-[13px] rounded-sm transition-colors ${getIntensityClass(day.count)}`}
                          />
                          <TooltipContent>
                            <p className="text-xs">
                              {day.count} action{day.count !== 1 ? "s" : ""} le{" "}
                              {day.date.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground mr-1">Moins</span>
            {[0, 1, 3, 5, 6].map((n) => (
              <div
                key={n}
                className={`h-[11px] w-[11px] rounded-sm ${getIntensityClass(n)}`}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">Plus</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
