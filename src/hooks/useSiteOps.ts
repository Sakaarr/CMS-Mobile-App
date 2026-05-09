import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useCreateDPR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/dprs`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["dprs", projectId] }),
  });
}