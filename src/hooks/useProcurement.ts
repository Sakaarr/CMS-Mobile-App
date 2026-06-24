import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";
import { Alert } from "react-native";

export interface Vendor {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  city: string | null;
  rating: number;
  credit_days: number;
}

export interface PO {
  id: string;
  po_number: string;
  vendor_name?: string;
  vendor_id: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  currency: string;
  delivery_date: string | null;
  created_at: string;
}

export interface GRN {
  id: string;
  grn_number: string;
  po_id: string;
  status: string;
  received_date: string;
  delivery_note: string | null;
  inspection_passed: boolean;
  notes: string | null;
  created_at: string;
}

export function useVendors(search?: string) {
  return useQuery({
    queryKey: ["vendors", search],
    queryFn: async () => {
      const p = search ? `?search=${search}` : "";
      const res = await apiClient.get(`/vendors${p}`);
      return res.data.data as Vendor[];
    },
  });
}

export function usePurchaseOrders(projectId: string) {
  return useQuery({
    queryKey: ["purchase-orders", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/purchase-orders`);
      return res.data.data as PO[];
    },
    enabled: !!projectId,
  });
}

export function useGRNs(projectId: string) {
  return useQuery({
    queryKey: ["grns", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/grns`);
      return res.data.data as GRN[];
    },
    enabled: !!projectId,
  });
}

export function useProcurementStats(projectId: string) {
  return useQuery({
    queryKey: ["procurement-stats", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/procurement-stats`);
      return res.data.data as {
        total_pos: number;
        total_po_value: number;
        pending_approval: number;
      };
    },
    enabled: !!projectId,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post("/vendors", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useCreatePO(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/purchase-orders`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", projectId] });
      qc.invalidateQueries({ queryKey: ["procurement-stats", projectId] });
    },
  });
}

export function useSubmitPO(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => apiClient.post(`/purchase-orders/${poId}/submit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders", projectId] });
      qc.invalidateQueries({ queryKey: ["procurement-stats", projectId] });
    },
  });
}

export function useCreateGRN(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/grns`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grns", projectId] });
    },
  });
}

export function useConfirmGRN(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grnId: string) => apiClient.post(`/grns/${grnId}/confirm`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["grns", projectId] }),
  });
}
