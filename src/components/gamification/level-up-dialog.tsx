"use client";

import { useEffect, useState } from "react";
import { getLevelTitle } from "@/lib/gamification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Trophy, Sparkles } from "lucide-react";

interface LevelUpDialogProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
}

export function LevelUpDialog({ open, onClose, newLevel }: LevelUpDialogProps) {
  const title = getLevelTitle(newLevel);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="relative">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-500/20 mx-auto mb-4 animate-bounce">
              <Trophy className="h-10 w-10 text-amber-500" />
            </div>
            {showConfetti && (
              <>
                <Sparkles className="absolute -top-2 -left-2 h-6 w-6 text-primary animate-ping" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-ping [animation-delay:200ms]" />
                <Sparkles className="absolute -bottom-2 left-4 h-5 w-5 text-amber-500 animate-ping [animation-delay:400ms]" />
                <Sparkles className="absolute -bottom-2 right-4 h-5 w-5 text-emerald-500 animate-ping [animation-delay:600ms]" />
              </>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold">
            Niveau {newLevel} !
          </DialogTitle>
          <DialogDescription className="text-base">
            Félicitations ! Vous êtes maintenant <span className="font-semibold text-amber-600 dark:text-amber-400">{title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: Math.min(newLevel, 5) }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-current" />
            ))}
          </div>
        </div>
        <Button onClick={onClose} className="w-full">
          Continuer
        </Button>
      </DialogContent>
    </Dialog>
  );
}
