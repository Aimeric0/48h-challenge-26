"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ColorThemeId } from "@/lib/themes";
import type { CustomThemeColors } from "@/lib/custom-theme";
import {
  generateCustomThemeCss,
  loadCustomThemeColors,
  saveCustomThemeColors,
  getDefaultCustomColors,
} from "@/lib/custom-theme";

const STORAGE_KEY = "color-theme";
const STYLE_TAG_ID = "custom-theme-style";

interface ColorThemeContextType {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
  customColors: CustomThemeColors;
  setCustomColors: (colors: CustomThemeColors) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: "default",
  setColorTheme: () => {},
  customColors: getDefaultCustomColors(),
  setCustomColors: () => {},
});

export function useColorTheme() {
  return useContext(ColorThemeContext);
}

function injectCustomThemeStyle(colors: CustomThemeColors) {
  const css = generateCustomThemeCss(colors);
  let el = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_TAG_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeCustomThemeStyle() {
  document.getElementById(STYLE_TAG_ID)?.remove();
}

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("default");
  const [customColors, setCustomColorsState] = useState<CustomThemeColors>(
    getDefaultCustomColors()
  );

  // Mount effect: rehydrate both theme and custom colors
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
    const savedColors = loadCustomThemeColors() ?? getDefaultCustomColors();
    setCustomColorsState(savedColors);

    if (stored) {
      setColorThemeState(stored);
      document.documentElement.setAttribute("data-color-theme", stored);
      if (stored === "custom") {
        injectCustomThemeStyle(savedColors);
      }
    }
  }, []);

  // Reactive effect: inject/remove style tag when theme or colors change
  useEffect(() => {
    if (colorTheme === "custom") {
      injectCustomThemeStyle(customColors);
    } else {
      removeCustomThemeStyle();
    }
  }, [colorTheme, customColors]);

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

  const setCustomColors = (colors: CustomThemeColors) => {
    setCustomColorsState(colors);
    saveCustomThemeColors(colors);
  };

  return (
    <ColorThemeContext.Provider
      value={{ colorTheme, setColorTheme, customColors, setCustomColors }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
}
