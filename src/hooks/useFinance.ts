import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useCreateExpense(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/expenses`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["expenses", projectId] }),
  });
}