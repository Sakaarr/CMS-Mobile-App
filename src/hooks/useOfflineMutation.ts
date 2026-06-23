import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { isOnline, addToQueue } from "@/src/lib/offline";
import { Alert } from "react-native";

export function useOfflineMutation<TData = any, TError = any, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    offlineLabel: string;
    offlineUrl: string;
    offlineMethod?: "post" | "patch" | "put" | "delete";
    invalidateQueries?: string[][];
  }
) {
  const qc = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      if (!isOnline()) {
        await addToQueue({
          label: options.offlineLabel,
          url: options.offlineUrl,
          method: options.offlineMethod ?? "post",
          data: variables,
        });
        Alert.alert(
          "Saved offline",
          `"${options.offlineLabel}" will sync when you're back online.`
        );
        return { offline: true } as any;
      }
      return options.mutationFn!(variables);
    },
    onSuccess: (data, variables, context) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((qk) => qc.invalidateQueries({ queryKey: qk }));
      }
      options.onSuccess?.(data, variables, context);
    },
  });
}
