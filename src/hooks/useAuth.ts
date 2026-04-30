import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { router } from "expo-router";

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      tenant_slug: string;
    }) => {
      const { tenant_slug, ...credentials } = data;
      await SecureStore.setItemAsync("tenant_slug", tenant_slug);
      const res = await apiClient.post("/auth/login", credentials);
      return { tokens: res.data.data, tenant_slug };
    },
    onSuccess: async ({ tokens, tenant_slug }) => {
      await SecureStore.setItemAsync("access_token", tokens.access_token);
      await SecureStore.setItemAsync("refresh_token", tokens.refresh_token);
      const meRes = await apiClient.get("/auth/me");
      const user = meRes.data.data;
      await SecureStore.setItemAsync("user", JSON.stringify(user));
      setAuth(user, tenant_slug);
      router.replace("/(app)/overview");
    },
  });
}