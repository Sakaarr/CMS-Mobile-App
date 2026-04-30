import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_superadmin: boolean;
}

interface AuthState {
  user: User | null;
  tenantSlug: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tenantSlug: string) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenantSlug: null,
  isAuthenticated: false,

  setAuth: (user, tenantSlug) => {
    set({ user, tenantSlug, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("tenant_slug");
    await SecureStore.deleteItemAsync("user");
    set({ user: null, tenantSlug: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const userStr = await SecureStore.getItemAsync("user");
      const tenantSlug = await SecureStore.getItemAsync("tenant_slug");
      const token = await SecureStore.getItemAsync("access_token");
      if (userStr && tenantSlug && token) {
        set({
          user: JSON.parse(userStr),
          tenantSlug,
          isAuthenticated: true,
        });
      }
    } catch {
      // Storage read failed, stay logged out
    }
  },
}));