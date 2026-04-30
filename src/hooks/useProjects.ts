import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get("/projects");
      return res.data.data as any[];
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: !!projectId,
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