import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, TextInput,
} from "react-native";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";
import { SyncBanner } from "@/src/components/SyncBanner";

const MODULE_EMOJI: Record<string, string> = {
  finance: "💰", procurement: "📋", inventory: "📦",
  boq: "📐", documents: "📂",
};

const MODULE_LABELS: Record<string, string> = {
  finance: "Finance", procurement: "Procurement", inventory: "Inventory",
  boq: "BOQ", documents: "Documents",
};

function buildActionEndpoints(item: any): { approve?: { url: string; method: string; body?: any }; reject?: { url: string; method: string; body?: any } } | null {
  const id = item.id;
  const docId = item.meta?.document_id;
  switch (item.item_type) {
    case "purchase_order_approval":
      return {
        approve: { url: `/purchase-orders/${id}/approve`, method: "post" },
        reject: { url: `/purchase-orders/${id}/reject`, method: "post", body: { reason: "" } },
      };
    case "invoice_approval":
      return {
        approve: { url: `/invoices/${id}/approve`, method: "post" },
        reject: { url: `/invoices/${id}/reject`, method: "post", body: { reason: "" } },
      };
    case "expense_approval":
      return {
        approve: { url: `/expenses/${id}/approve`, method: "post" },
        reject: { url: `/expenses/${id}/reject`, method: "post", body: { reason: "" } },
      };
    case "change_order_approval":
      return {
        approve: { url: `/change-orders/${id}/approve`, method: "post" },
        reject: { url: `/change-orders/${id}/reject`, method: "post", body: { reason: "" } },
      };
    case "material_request_approval":
      return {
        reject: { url: `/material-requests/${id}/reject`, method: "post", body: { reason: "" } },
      };
    case "budget_version_approval":
      return {
        approve: { url: `/budget-versions/${id}/approve`, method: "post" },
      };
    case "document_review":
      if (!docId) return null;
      return {
        approve: { url: `/documents/${docId}/approvals/${id}`, method: "patch", body: { status: "approved" } },
        reject: { url: `/documents/${docId}/approvals/${id}`, method: "patch", body: { status: "rejected", comments: "" } },
      };
    default:
      return null;
  }
}

export default function ApprovalsScreen() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["approvals-inbox"],
    queryFn: async () => {
      const res = await apiClient.get("/approvals/inbox?limit=200");
      return res.data.data;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["approvals-inbox"] });
    setRefreshing(false);
  }, []);

  const performAction = async (item: any, action: "approve" | "reject") => {
    const endpoints = buildActionEndpoints(item);
    if (!endpoints || !endpoints[action]) return;

    const ep = endpoints[action]!;
    const key = `${item.id}-${action}`;
    setActionLoading(key);

    try {
      let body = ep.body ? { ...ep.body } : undefined;
      if (action === "reject" && body && "reason" in body) {
        body.reason = "";
      }
      if (action === "reject" && body && "comments" in body) {
        body.comments = "";
      }

      if (ep.method === "post") {
        await apiClient.post(ep.url, body);
      } else {
        await apiClient.patch(ep.url, body);
      }

      Alert.alert("Done", `Item ${action === "approve" ? "approved" : "rejected"} successfully`);
      qc.invalidateQueries({ queryKey: ["approvals-inbox"] });
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (item: any, action: "approve" | "reject") => {
    const label = action === "approve" ? "approve" : "reject";
    Alert.alert(
      `${action === "approve" ? "Approve" : "Reject"} ${item.item_type.replace(/_/g, " ")}`,
      `Are you sure you want to ${label} "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: action === "approve" ? "Approve" : "Reject", style: action === "reject" ? "destructive" : "default", onPress: () => performAction(item, action) },
      ]
    );
  };

  const items = data?.items ?? [];
  const counts = (data?.counts ?? {}) as Record<string, number>;
  const filteredItems = filterModule
    ? items.filter((i: any) => i.module === filterModule)
    : items;

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <SyncBanner />
      <View style={s.header}>
        <Text style={s.title}>Approvals</Text>
        <Text style={s.sub}>{data?.total ?? 0} pending</Text>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.chipScroll}
        contentContainerStyle={s.chipContainer}
      >
        <TouchableOpacity
          style={[s.chip, !filterModule && s.chipActive]}
          onPress={() => setFilterModule(null)}
        >
          <Text style={[s.chipText, !filterModule && s.chipTextActive]}>All ({data?.total ?? 0})</Text>
        </TouchableOpacity>
        {Object.entries(counts).map(([mod, count]) => (
          <TouchableOpacity
            key={mod}
            style={[s.chip, filterModule === mod && s.chipActive]}
            onPress={() => setFilterModule(mod)}
          >
            <Text style={[s.chipText, filterModule === mod && s.chipTextActive]}>
              {MODULE_EMOJI[mod] ?? "📄"} {MODULE_LABELS[mod] ?? mod} ({count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
      >
        {!filteredItems.length ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>✅</Text>
            <Text style={s.emptyText}>All clear — no pending approvals</Text>
          </View>
        ) : filteredItems.map((item: any) => {
          const endpoints = buildActionEndpoints(item);
          const appKey = `${item.id}-approve`;
          const rejKey = `${item.id}-reject`;

          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardIcon}>
                <Text style={s.cardEmoji}>{MODULE_EMOJI[item.module] ?? "📄"}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.cardSub} numberOfLines={1}>{item.subtitle}</Text>
                {item.project_name && (
                  <Text style={s.cardProject}>{item.project_name} ({item.project_code})</Text>
                )}
                <Text style={s.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={s.cardRight}>
                {/* Action buttons */}
                {endpoints?.approve && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.approveBtn]}
                    onPress={() => handleAction(item, "approve")}
                    disabled={actionLoading === appKey}
                  >
                    {actionLoading === appKey
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.approveBtnText}>✓</Text>
                    }
                  </TouchableOpacity>
                )}
                {endpoints?.reject && (
                  <TouchableOpacity
                    style={[s.actionBtn, s.rejectBtn]}
                    onPress={() => handleAction(item, "reject")}
                    disabled={actionLoading === rejKey}
                  >
                    {actionLoading === rejKey
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.rejectBtnText}>✕</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  chipScroll: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", flexGrow: 0 },
  chipContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99,
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff", marginRight: 8,
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#4b5563", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  list: { flex: 1 },
  listContent: { padding: 12 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 8, borderWidth: 0.5, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  cardEmoji: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  cardProject: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  cardDate: { fontSize: 10, color: "#9ca3af", marginTop: 1, fontFamily: "monospace" },
  cardRight: { flexDirection: "row", gap: 6, alignItems: "center" },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  approveBtn: { backgroundColor: "#10b981" },
  rejectBtn: { backgroundColor: "#ef4444" },
  approveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rejectBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
