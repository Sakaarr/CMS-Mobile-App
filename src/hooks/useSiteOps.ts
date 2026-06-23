import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface DPRSummary {
  id: string;
  project_id: string;
  site_id: string;
  report_date: string;
  weather: string;
  is_submitted: boolean;
  total_workers: number;
}

export interface DPR extends DPRSummary {
  temperature_celsius: number | null;
  work_hours: number;
  general_notes: string | null;
  safety_notes: string | null;
  total_labour_cost: number;
  work_items: WorkItem[];
  attendance_records: AttendanceRecord[];
  equipment_logs: EquipmentLog[];
}

export interface WorkItem {
  id: string;
  description: string;
  unit: string;
  planned_quantity: number;
  achieved_quantity: number;
  boq_item_id?: string | null;
  remarks: string | null;
  location: string | null;
}

export interface AttendanceRecord {
  id: string;
  worker_name: string;
  trade: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
  daily_wage: number;
  is_subcontractor: boolean;
}

export interface EquipmentLog {
  id: string;
  equipment_name: string;
  status: string;
  working_hours: number;
  idle_hours: number;
  fuel_consumed: number;
}

export interface SiteOpsSummary {
  total_dprs: number;
  submitted_dprs: number;
  total_worker_days: number;
  total_labour_cost: number;
}

export function useDPRs(projectId: string, siteId?: string) {
  return useQuery({
    queryKey: ["dprs", projectId, siteId],
    queryFn: async () => {
      const p = siteId ? `?site_id=${siteId}` : "";
      const res = await apiClient.get(`/projects/${projectId}/dprs${p}`);
      return res.data as { data: DPRSummary[]; total: number };
    },
    enabled: !!projectId,
  });
}

export function useDPR(dprId: string) {
  return useQuery({
    queryKey: ["dpr", dprId],
    queryFn: async () => {
      const res = await apiClient.get(`/dprs/${dprId}`);
      return res.data.data as DPR;
    },
    enabled: !!dprId,
  });
}

export function useSiteOpsSummary(projectId: string) {
  return useQuery({
    queryKey: ["site-ops-summary", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/site-ops-summary`
      );
      return res.data.data as SiteOpsSummary;
    },
    enabled: !!projectId,
  });
}

export function useCreateDPR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/dprs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dprs", projectId] });
      qc.invalidateQueries({ queryKey: ["site-ops-summary", projectId] });
    },
  });
}

export function useSubmitDPR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dprId: string) =>
      apiClient.post(`/dprs/${dprId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dprs", projectId] });
      qc.invalidateQueries({ queryKey: ["site-ops-summary", projectId] });
    },
  });
}