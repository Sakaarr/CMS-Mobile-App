import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useDocuments(
  projectId: string,
  params?: { search?: string; category?: string }
) {
  return useQuery({
    queryKey: ["documents", projectId, params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.search) p.set("search", params.search);
      if (params?.category) p.set("category", params.category);
      const res = await apiClient.get(
        `/projects/${projectId}/documents?${p}`
      );
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useDocumentSummary(projectId: string) {
  return useQuery({
    queryKey: ["document-summary", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/document-summary`
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useUploadDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/documents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", projectId] });
      qc.invalidateQueries({ queryKey: ["document-summary", projectId] });
    },
  });
}