"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ColorThemeId } from "@/lib/themes";

const STORAGE_KEY = "color-theme";

interface ColorThemeContextType {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: "default",
  setColorTheme: () => {},
});

export function useColorTheme() {
  return useContext(ColorThemeContext);
}

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("default");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
    if (stored) {
      setColorThemeState(stored);
      document.documentElement.setAttribute("data-color-theme", stored);
    }
  }, []);

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme);
    if (theme === "default") {
      document.documentElement.removeAttribute("data-color-theme");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      document.documentElement.setAttribute("data-color-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}
