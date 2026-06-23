import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";
import { cacheQueryData, getCachedQueryData } from "@/src/lib/offline";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get("/projects");
      const data = res.data.data as any[];
      await cacheQueryData("projects", data);
      return data;
    },
    placeholderData: () => getCachedQueryData<any[]>("projects") ?? undefined,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      const data = res.data.data;
      await cacheQueryData(`project_${projectId}`, data);
      return data;
    },
    enabled: !!projectId,
    placeholderData: () => getCachedQueryData<any>(`project_${projectId}`) ?? undefined,
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ["project-stats"],
    queryFn: async () => {
      const res = await apiClient.get("/projects/stats");
      return res.data.data;
    },
  });
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/milestones`);
      return res.data.data as any[];
    },
    enabled: !!projectId,
  });
}

export function useSites(projectId: string) {
  return useQuery({
    queryKey: ["sites", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/sites`);
      return res.data.data as any[];
    },
    enabled: !!projectId,
  });
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: string }) =>
      apiClient.patch(`/projects/${projectId}/status`, { status }),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}