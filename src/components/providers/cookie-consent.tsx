"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("cookie-notice-dismissed");
    if (!dismissed) {
      setShowBanner(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cookie-notice-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-muted-foreground">
          Ce site utilise uniquement des cookies essentiels à
          l&apos;authentification. Aucun cookie de suivi n&apos;est utilisé.{" "}
          <a
            href="/privacy"
            className="text-foreground underline underline-offset-4"
          >
            Politique de confidentialité
          </a>
        </p>
        <Button size="sm" onClick={dismiss}>
          Compris
        </Button>
      </div>
    </div>
  );
}
