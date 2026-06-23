import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth.store";
import {
  startNetworkMonitor,
  processQueue,
} from "@/src/lib/offline";
import { AppState, AppStateStatus } from "react-native";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    startNetworkMonitor(15_000);

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") processQueue();
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}