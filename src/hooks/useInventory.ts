import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useCreateMR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/material-requests`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["material-requests", projectId] }),
  });
}

export function useSubmitMR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mrId: string) =>
      apiClient.post(`/material-requests/${mrId}/submit`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["material-requests", projectId] }),
  });
}