import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface FinanceSummary {
  total_invoiced: number;
  total_received: number;
  total_outstanding: number;
  total_expenses: number;
  total_change_orders: number;
  overdue_invoices: number;
  pending_approval: number;
  invoice_by_status: Record<string, { count: number; total: number }>;
}

export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  invoice_type: string;
  status: string;
  client_name: string | null;
  invoice_date: string;
  due_date: string | null;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
}

export interface Expense {
  id: string;
  project_id: string;
  expense_number: string;
  category: string;
  status: string;
  description: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  expense_date: string;
  vendor_name: string | null;
  boq_item_id?: string | null;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  co_number: string;
  title: string;
  status: string;
  amount: number;
  impact_days: number;
  revised_contract_value: number | null;
}

export function useFinanceSummary(projectId: string) {
  return useQuery({
    queryKey: ["finance-summary", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/finance-summary`
      );
      return res.data.data as FinanceSummary;
    },
    enabled: !!projectId,
  });
}

export function useInvoices(projectId: string, params?: {
  status?: string;
  invoice_type?: string;
}) {
  return useQuery({
    queryKey: ["invoices", projectId, params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.status) p.set("status", params.status);
      if (params?.invoice_type) p.set("invoice_type", params.invoice_type);
      const res = await apiClient.get(
        `/projects/${projectId}/invoices?${p}`
      );
      return res.data.data as Invoice[];
    },
    enabled: !!projectId,
  });
}

export function useExpenses(projectId: string) {
  return useQuery({
    queryKey: ["expenses", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/expenses`);
      return res.data.data as Expense[];
    },
    enabled: !!projectId,
  });
}

export function useChangeOrders(projectId: string) {
  return useQuery({
    queryKey: ["change-orders", projectId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/projects/${projectId}/change-orders`
      );
      return res.data.data as ChangeOrder[];
    },
    enabled: !!projectId,
  });
}

export function useCashflow(projectId: string) {
  return useQuery({
    queryKey: ["cashflow", projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/cashflow`);
      return res.data.data as Array<{
        month: string;
        invoiced: number;
        received: number;
        expenses: number;
      }>;
    },
    enabled: !!projectId,
  });
}

export function useCreateExpense(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/expenses`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", projectId] });
      qc.invalidateQueries({ queryKey: ["finance-summary", projectId] });
    },
  });
}

export function useCreateInvoice(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/invoices`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", projectId] });
      qc.invalidateQueries({ queryKey: ["finance-summary", projectId] });
    },
  });
}

export function useSubmitInvoice(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      apiClient.post(`/invoices/${invoiceId}/submit`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["invoices", projectId] }),
  });
}

export function useCreateChangeOrder(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/projects/${projectId}/change-orders`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["change-orders", projectId] }),
  });
}