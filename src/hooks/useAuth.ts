import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { router } from "expo-router";
import { setItem } from "@/src/lib/storage";

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      tenant_slug: string;
    }) => {
      const { tenant_slug, ...credentials } = data;
      await setItem("tenant_slug", tenant_slug);
      const res = await apiClient.post("/auth/login", credentials);
      return { tokens: res.data.data, tenant_slug };
    },
    onSuccess: async ({ tokens, tenant_slug }) => {
      await setItem("access_token", tokens.access_token);
      await setItem("refresh_token", tokens.refresh_token);
      const meRes = await apiClient.get("/auth/me");
      const user = meRes.data.data;
      await setItem("user", JSON.stringify(user));
      setAuth(user, tenant_slug);

      // Route based on must_change_password flag
      if (user.must_change_password) {
        router.replace("/(auth)/change-password");
      } else {
        router.replace("/(app)/overview");
      }
    },
  });
}
