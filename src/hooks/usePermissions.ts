import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";
import { create } from "zustand";

export interface ModulePermissions {
  can_projects: boolean;
  can_boq: boolean;
  can_procurement: boolean;
  can_inventory: boolean;
  can_site_ops: boolean;
  can_finance: boolean;
  can_quality: boolean;
  can_documents: boolean;
  can_subcontractors: boolean;
}

const FULL_ACCESS: ModulePermissions = {
  can_projects: true, can_boq: true, can_procurement: true,
  can_inventory: true, can_site_ops: true, can_finance: true,
  can_quality: true, can_documents: true, can_subcontractors: true,
};

interface PermStore {
  permissions: ModulePermissions;
  setPermissions: (p: ModulePermissions) => void;
}

export const usePermStore = create<PermStore>(set => ({
  permissions: FULL_ACCESS,
  setPermissions: p => set({ permissions: p }),
}));

export function useFetchPermissions(enabled: boolean) {
  const { setPermissions } = usePermStore();
  return useQuery({
    queryKey: ["my-permissions"],
    queryFn: async () => {
      const res = await apiClient.get("/users/me/permissions");
      const perms = res.data.data as ModulePermissions;
      setPermissions(perms);
      return perms;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHasPermission(module: keyof ModulePermissions): boolean {
  const { permissions } = usePermStore();
  return permissions[module] ?? false;
}