import { create } from "zustand";
import { deleteItem, getItem } from "@/src/lib/storage";

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
    await deleteItem("access_token");
    await deleteItem("refresh_token");
    await deleteItem("tenant_slug");
    await deleteItem("user");
    set({ user: null, tenantSlug: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const userStr = await getItem("user");
      const tenantSlug = await getItem("tenant_slug");
      const token = await getItem("access_token");
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
