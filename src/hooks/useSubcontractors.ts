import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface Subcontractor {
  id: string;
  name: string;
  code: string;
  specialty: string;
  status: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  rating: number;
  is_approved: boolean;
}

export interface SubcontractorContract {
  id: string;
  project_id: string;
  subcontractor_id: string;
  contract_number: string;
  title: string;
  status: string;
  contract_value: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
}

export interface WorkOrder {
  id: string;
  project_id: string;
  contract_id: string;
  work_order_number: string;
  title: string;
  status: string;
  amount: number;
  currency: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
}

export function useSubcontractors(search?: string) {
  return useQuery({
    queryKey: ["subcontractors", search],
    queryFn: async () => {
      const p = search ? `?search=${search}` : "";
      const res = await apiClient.get(`/subcontractors${p}`);
      return res.data.data as Subcontractor[];
    },
  });
}

export function useSubcontractor(id: string) {
  return useQuery({
    queryKey: ["subcontractor", id],
    queryFn: async () => {
      const res = await apiClient.get(`/subcontractors/${id}`);
      return res.data.data as Subcontractor;
    },
    enabled: !!id,
  });
}

export function useCreateSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post("/subcontractors", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subcontractors"] }),
  });
}

export function useContracts(params?: {
  project_id?: string; subcontractor_id?: string; status?: string;
}) {
  return useQuery({
    queryKey: ["contracts", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.project_id) p.set("project_id", params.project_id);
      if (params?.subcontractor_id) p.set("subcontractor_id", params.subcontractor_id);
      if (params?.status) p.set("status", params.status);
      const res = await apiClient.get(`/contracts?${p}`);
      return res.data.data as SubcontractorContract[];
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      apiClient.post(`/projects/${projectId}/contracts`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useWorkOrders(params?: {
  project_id?: string; contract_id?: string; status?: string;
}) {
  return useQuery({
    queryKey: ["work-orders", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.project_id) p.set("project_id", params.project_id);
      if (params?.contract_id) p.set("contract_id", params.contract_id);
      if (params?.status) p.set("status", params.status);
      const res = await apiClient.get(`/work-orders?${p}`);
      return res.data.data as WorkOrder[];
    },
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      apiClient.post(`/projects/${projectId}/work-orders`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}
