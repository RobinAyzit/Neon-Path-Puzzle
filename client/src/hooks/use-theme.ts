import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Theme, getTheme } from "@/lib/themes";

interface ThemeStore {
  currentTheme: string;
  visitedThemes: string[];
  setTheme: (themeId: string) => void;
  getThemeColors: () => Theme["colors"];
  getThemeEffects: () => Theme["effects"];
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: "cyberpunk",
      visitedThemes: ["cyberpunk"],
      setTheme: themeId => {
        const theme = getTheme(themeId);
        set(state => ({
          currentTheme: themeId,
          visitedThemes: state.visitedThemes.includes(themeId)
            ? state.visitedThemes
            : [...state.visitedThemes, themeId],
        }));
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
          const cssValue = Array.isArray(value) ? value.join(",") : value;
          root.style.setProperty(`--theme-${key}`, cssValue);
        });
        root.style.setProperty("--theme-glow", theme.effects.glow);
      },
      getThemeColors: () => getTheme(get().currentTheme).colors,
      getThemeEffects: () => getTheme(get().currentTheme).effects,
    }),
    {
      name: "neon-path-theme",
      merge: (persisted, current) => {
        const saved = persisted as Partial<ThemeStore>;
        const currentTheme = saved.currentTheme || current.currentTheme;
        return {
          ...current,
          ...saved,
          currentTheme,
          visitedThemes: saved.visitedThemes || [currentTheme],
        };
      },
    },
  ),
);

export const useTheme = () => useThemeStore();
