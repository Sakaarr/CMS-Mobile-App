import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  project_id: string | null;
  site_id: string | null;
  status: string;
  is_site_store: boolean;
}

export interface StockItem {
  id: string;
  warehouse_id: string;
  material_code: string;
  description: string;
  unit: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_level: number;
  unit_cost: number;
  needs_reorder: boolean;
}

export interface MaterialRequest {
  id: string;
  project_id: string;
  mr_number: string;
  status: string;
  required_date: string | null;
  purpose: string | null;
  items: MRItem[];
}

export interface MRItem {
  id: string;
  material_code: string;
  description: string;
  unit: string;
  requested_quantity: number;
  approved_quantity: number;
  issued_quantity: number;
  boq_item_id?: string | null;
}

export function useWarehouses(projectId?: string) {
  return useQuery({
    queryKey: ["warehouses", projectId],
    queryFn: async () => {
      const p = projectId ? `?project_id=${projectId}` : "";
      const res = await apiClient.get(`/warehouses${p}`);
      return res.data.data as Warehouse[];
    },
  });
}

export function useStock(warehouseId: string) {
  return useQuery({
    queryKey: ["stock", warehouseId],
    queryFn: async () => {
      const res = await apiClient.get(`/warehouses/${warehouseId}/stock`);
      return res.data.data as StockItem[];
    },
    enabled: !!warehouseId,
  });
}

export function useMaterialRequests(projectId: string) {
  return useQuery({
    queryKey: ["material-requests", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/material-requests`
      );
      return res.data.data as MaterialRequest[];
    },
    enabled: !!projectId,
  });
}

export function useLowStockAlerts(projectId?: string) {
  return useQuery({
    queryKey: ["low-stock", projectId],
    queryFn: async () => {
      const p = projectId ? `?project_id=${projectId}` : "";
      const res = await apiClient.get(`/inventory/low-stock${p}`);
      return res.data.data as StockItem[];
    },
  });
}

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

export function useApproveMR(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mrId,
      items,
    }: {
      mrId: string;
      items: { item_id: string; approved_quantity: number }[];
    }) => apiClient.post(`/material-requests/${mrId}/approve`, items),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["material-requests", projectId] }),
  });
}

export function useRecordTransaction(warehouseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/warehouses/${warehouseId}/transactions`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stock", warehouseId] }),
  });
}