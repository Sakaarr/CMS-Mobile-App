import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface QualitySummary {
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  open_ncrs: number;
  critical_ncrs: number;
  open_incidents: number;
  open_punch_items: number;
  avg_inspection_score: number;
}

export interface Inspection {
  id: string;
  inspection_number: string;
  title: string;
  inspection_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  inspector_name: string | null;
  location: string | null;
  score: number | null;
}

export interface NCR {
  id: string;
  ncr_number: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  location: string | null;
  due_date: string | null;
}

export interface SafetyIncident {
  id: string;
  incident_number: string;
  title: string;
  severity: string;
  status: string;
  incident_date: string;
  injuries: number;
  fatalities: number;
  is_reportable: boolean;
}

export interface PunchItem {
  id: string;
  item_number: string;
  description: string;
  status: string;
  priority: string;
  location: string | null;
  due_date: string | null;
}

export function useQualitySummary(projectId: string) {
  return useQuery({
    queryKey: ["quality-summary", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/quality-summary`
      );
      return res.data.data as QualitySummary;
    },
    enabled: !!projectId,
  });
}

export function useInspections(projectId: string, status?: string) {
  return useQuery({
    queryKey: ["inspections", projectId, status],
    queryFn: async () => {
      const p = status ? `?status=${status}` : "";
      const res = await apiClient.get(
        `/projects/${projectId}/inspections${p}`
      );
      return res.data.data as Inspection[];
    },
    enabled: !!projectId,
  });
}

export function useNCRs(projectId: string, status?: string) {
  return useQuery({
    queryKey: ["ncrs", projectId, status],
    queryFn: async () => {
      const p = status ? `?status=${status}` : "";
      const res = await apiClient.get(
        `/projects/${projectId}/ncrs${p}`
      );
      return res.data.data as NCR[];
    },
    enabled: !!projectId,
  });
}

export function useIncidents(projectId: string) {
  return useQuery({
    queryKey: ["incidents", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/safety-incidents`
      );
      return res.data.data as SafetyIncident[];
    },
    enabled: !!projectId,
  });
}

export function usePunchList(projectId: string, status?: string) {
  return useQuery({
    queryKey: ["punch-list", projectId, status],
    queryFn: async () => {
      const p = status ? `?status=${status}` : "";
      const res = await apiClient.get(
        `/projects/${projectId}/punch-list${p}`
      );
      return res.data.data as PunchItem[];
    },
    enabled: !!projectId,
  });
}

export function useCreateInspection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/inspections`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", projectId] });
      qc.invalidateQueries({ queryKey: ["quality-summary", projectId] });
    },
  });
}

export function useCreateNCR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/ncrs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncrs", projectId] });
      qc.invalidateQueries({ queryKey: ["quality-summary", projectId] });
    },
  });
}

export function useUpdateNCR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ncrId, data }: { ncrId: string; data: any }) =>
      apiClient.patch(`/ncrs/${ncrId}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["ncrs", projectId] }),
  });
}

export function useCreateIncident(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/safety-incidents`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", projectId] });
      qc.invalidateQueries({ queryKey: ["quality-summary", projectId] });
    },
  });
}

export function useCreatePunchItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/punch-list`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["punch-list", projectId] }),
  });
}

export function useUpdatePunchItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      apiClient.patch(`/punch-list/${itemId}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["punch-list", projectId] }),
  });
}

export function usePassInspection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inspectionId: string) =>
      apiClient.post(`/inspections/${inspectionId}/pass`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", projectId] });
      qc.invalidateQueries({ queryKey: ["quality-summary", projectId] });
    },
  });
}

export function useFailInspection(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inspectionId: string) =>
      apiClient.post(`/inspections/${inspectionId}/fail`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", projectId] });
      qc.invalidateQueries({ queryKey: ["quality-summary", projectId] });
    },
  });
}