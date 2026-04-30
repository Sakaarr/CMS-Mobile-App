import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native";
import { useProjects } from "@/src/hooks/useProjects";

export default function BOQScreen() {
  const { data: projects, isLoading } = useProjects();
  const active = projects?.filter((p: any) => p.status === "active") ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>BOQ & Estimation</Text>
      <Text style={styles.sub}>Budget overview for active projects</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : active.length === 0 ? (
        <Text style={styles.empty}>No active projects with BOQ</Text>
      ) : (
        active.map((p: any) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardName}>{p.name}</Text>
            <Text style={styles.cardCode}>{p.code}</Text>
            {p.estimated_budget ? (
              <View style={styles.budgetRow}>
                <View style={styles.budgetBox}>
                  <Text style={styles.budgetLabel}>Estimated</Text>
                  <Text style={styles.budgetValue}>
                    NPR {Number(p.estimated_budget).toLocaleString()}
                  </Text>
                </View>
                {p.approved_budget && (
                  <View style={styles.budgetBox}>
                    <Text style={styles.budgetLabel}>Approved</Text>
                    <Text style={[styles.budgetValue, { color: "#10b981" }]}>
                      NPR {Number(p.approved_budget).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noBudget}>No budget set</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 20, marginTop: 2 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardCode: { fontSize: 12, color: "#6b7280", marginBottom: 12 },
  budgetRow: { flexDirection: "row", gap: 12 },
  budgetBox: {
    flex: 1, backgroundColor: "#f8fafc", borderRadius: 10,
    padding: 10, alignItems: "center",
  },
  budgetLabel: { fontSize: 11, color: "#6b7280" },
  budgetValue: { fontSize: 14, fontWeight: "700", color: "#1d4ed8", marginTop: 2 },
  noBudget: { fontSize: 13, color: "#9ca3af" },
});