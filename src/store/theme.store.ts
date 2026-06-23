import { create } from "zustand";
import { getItem, setItem } from "@/src/lib/storage";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  setTheme: async (theme) => {
    await setItem("app_theme", theme);
    set({ theme });
  },
  loadTheme: async () => {
    try {
      const saved = await getItem("app_theme");
      if (saved) set({ theme: saved as Theme });
    } catch {}
  },
}));
