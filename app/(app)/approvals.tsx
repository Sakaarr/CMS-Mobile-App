import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

const MODULE_EMOJI: Record<string, string> = {
  finance: "💰", procurement: "📋", inventory: "📦",
  boq: "📐", documents: "📂",
};

const MODULE_LABELS: Record<string, string> = {
  finance: "Finance", procurement: "Procurement", inventory: "Inventory",
  boq: "BOQ", documents: "Documents",
};

export default function ApprovalsScreen() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filterModule, setFilterModule] = useState<string | null>(null);

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
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Approvals</Text>
        <Text style={s.sub}>{data?.total ?? 0} pending</Text>
      </View>

      {/* Module filter chips */}
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

      {/* List */}
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
        ) : filteredItems.map((item: any) => (
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
              <View style={[s.badge, { backgroundColor: item.status === "submitted" || item.status === "pending" || item.status === "pending_approval" ? "#dbeafe" : "#f3f4f6" }]}>
                <Text style={[s.badgeText, { color: item.status === "submitted" || item.status === "pending" || item.status === "pending_approval" ? "#1d4ed8" : "#4b5563" }]}>
                  {item.status.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  cardRight: { alignItems: "flex-end", gap: 4 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
});
