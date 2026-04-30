import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useProjectStats, useProjects } from "@/src/hooks/useProjects";
import { useAuthStore } from "@/src/store/auth.store";

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", draft: "#94a3b8", planning: "#60a5fa",
  on_hold: "#f59e0b", completed: "#059669", cancelled: "#ef4444",
};

export default function OverviewScreen() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useProjectStats();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Hello, {user?.full_name?.split(" ")[0]} 👋
      </Text>
      <Text style={styles.sub}>Here's your site overview</Text>

      {/* KPI Row */}
      {statsLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color="#2563eb" />
      ) : (
        <View style={styles.kpiRow}>
          <KPICard label="Total" value={String(stats?.total ?? 0)} color="#2563eb" />
          <KPICard label="Active" value={String(stats?.by_status?.active ?? 0)} color="#10b981" />
          <KPICard label="On Hold" value={String(stats?.by_status?.on_hold ?? 0)} color="#f59e0b" />
          <KPICard label="Done" value={String(stats?.by_status?.completed ?? 0)} color="#6366f1" />
        </View>
      )}

      {/* Recent projects */}
      <Text style={styles.sectionTitle}>Recent projects</Text>
      {projectsLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        projects?.slice(0, 5).map((p: any) => (
          <View key={p.id} style={styles.projectRow}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{p.name}</Text>
              <Text style={styles.projectCode}>{p.code} · {p.city ?? "—"}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[p.status] + "22" }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] }]}>
                {p.status.replace("_", " ")}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 2, marginBottom: 20 },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  kpiCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  kpiValue: { fontSize: 22, fontWeight: "700" },
  kpiLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  projectRow: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
});