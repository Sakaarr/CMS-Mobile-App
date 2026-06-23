import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, TextInput,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/src/hooks/useProjects";
import { SyncBanner } from "@/src/components/SyncBanner";
import { router } from "expo-router";

export default function ProjectsScreen() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useProjects();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
    setRefreshing(false);
  }, [queryClient]);

  const filtered = projects?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <View style={styles.container}>
      <SyncBanner />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search projects..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        >
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No projects found</Text>
          ) : (
            filtered.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                onPress={() => router.push(`/(app)/projects/${p.id}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <StatusBadge status={p.status} />
                </View>
                <Text style={styles.cardCode}>{p.code} · {p.city ?? "—"}</Text>

                {/* Progress bar */}
                <View style={styles.progressWrap}>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${p.progress_percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {p.progress_percentage}%
                  </Text>
                </View>

                {p.estimated_budget && (
                  <Text style={styles.budget}>
                    Budget: NPR {Number(p.estimated_budget).toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active: ["#dcfce7", "#16a34a"],
    draft: ["#f3f4f6", "#4b5563"],
    planning: ["#dbeafe", "#1d4ed8"],
    on_hold: ["#fef9c3", "#a16207"],
    completed: ["#d1fae5", "#047857"],
    cancelled: ["#fee2e2", "#dc2626"],
  };
  const [bg, fg] = colors[status] ?? ["#f3f4f6", "#4b5563"];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>
        {status.replace("_", " ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  searchWrap: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: "#fff", borderRadius: 10, height: 42,
    paddingHorizontal: 14, fontSize: 14, color: "#111827",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  list: { padding: 16, paddingTop: 8 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  cardCode: { fontSize: 12, color: "#6b7280", marginBottom: 10 },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  progressBg: { flex: 1, height: 6, backgroundColor: "#e5e7eb", borderRadius: 99 },
  progressFill: { height: 6, backgroundColor: "#2563eb", borderRadius: 99 },
  progressText: { fontSize: 11, color: "#6b7280", width: 32 },
  budget: { fontSize: 12, color: "#4b5563" },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
});