import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useCreateIncident(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/safety-incidents`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["incidents", projectId] }),
  });
}

export function useCreateNCR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post(`/projects/${projectId}/ncrs`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["ncrs", projectId] }),
  });
}