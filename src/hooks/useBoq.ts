import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface BudgetVersion {
  id: string;
  project_id: string;
  version_number: number;
  name: string;
  status: "draft" | "submitted" | "approved" | "superseded";
  total_material_cost: number;
  total_labour_cost: number;
  total_equipment_cost: number;
  total_amount: number;
  contingency_percentage: number;
  contingency_amount: number;
  grand_total: number;
  currency: string;
}

export interface BOQItem {
  id: string;
  item_number: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate: number;
  amount: number;
  material_rate: number;
  labour_rate: number;
  equipment_rate: number;
  actual_quantity: number;
  actual_amount: number;
  is_section_header: boolean;
  status: string;
  parent_id: string | null;
  sort_order: number;
}

export interface BOQSummary {
  version_id: string;
  grand_total: number;
  total_amount: number;
  contingency_amount: number;
  total_material_cost: number;
  total_labour_cost: number;
  total_equipment_cost: number;
  items_count: number;
  planned_total: number;
  actual_total: number;
  variance: number;
}

export function useBudgetVersions(projectId: string) {
  return useQuery({
    queryKey: ["budget-versions", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/budget-versions`
      );
      return res.data.data as BudgetVersion[];
    },
    enabled: !!projectId,
  });
}

export function useBOQItems(versionId: string) {
  return useQuery({
    queryKey: ["boq-items", versionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/budget-versions/${versionId}/items`
      );
      return res.data.data as BOQItem[];
    },
    enabled: !!versionId,
  });
}

export function useBOQSummary(versionId: string) {
  return useQuery({
    queryKey: ["boq-summary", versionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/budget-versions/${versionId}/summary`
      );
      return res.data.data as BOQSummary;
    },
    enabled: !!versionId,
  });
}

export function useCreateBudgetVersion(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      contingency_percentage: number;
      currency: string;
    }) =>
      apiClient.post(`/projects/${projectId}/budget-versions`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["budget-versions", projectId] }),
  });
}

export function useApproveBudgetVersion(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      apiClient.post(`/budget-versions/${versionId}/approve`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["budget-versions", projectId] }),
  });
}