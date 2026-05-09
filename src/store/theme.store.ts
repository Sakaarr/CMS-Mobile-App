import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  setTheme: async (theme) => {
    await SecureStore.setItemAsync("app_theme", theme);
    set({ theme });
  },
  loadTheme: async () => {
    try {
      const saved = await SecureStore.getItemAsync("app_theme");
      if (saved) set({ theme: saved as Theme });
    } catch {}
  },
}));