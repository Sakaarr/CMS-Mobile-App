import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  Dimensions, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { useProject, useMilestones, useSites, useUpdateProjectStatus } from "@/src/hooks/useProjects";
import { useBudgetVersions } from "@/src/hooks/useBoq";
import { useProcurementStats } from "@/src/hooks/useProcurement";
import { useSiteOpsSummary } from "@/src/hooks/useSiteOps";
import { useFinanceSummary } from "@/src/hooks/useFinance";

const { width } = Dimensions.get("window");

const TABS = ["Overview", "Sites", "BOQ", "Finance", "Site Ops"] as const;
type Tab = typeof TABS[number];

const STATUS_COLORS: Record<string, [string, string]> = {
  active:    ["#dcfce7", "#16a34a"],
  draft:     ["#f3f4f6", "#4b5563"],
  planning:  ["#dbeafe", "#1d4ed8"],
  on_hold:   ["#fef9c3", "#a16207"],
  completed: ["#d1fae5", "#047857"],
  cancelled: ["#fee2e2", "#dc2626"],
};

const MILESTONE_COLORS: Record<string, string> = {
  completed:   "#10b981",
  in_progress: "#3b82f6",
  delayed:     "#ef4444",
  pending:     "#9ca3af",
};

const STATUS_TRANSITIONS: Record<string, { next: string; label: string }[]> = {
  draft:    [{ next: "planning", label: "Start planning" }],
  planning: [{ next: "active", label: "Activate" }, { next: "on_hold", label: "Hold" }],
  active:   [{ next: "on_hold", label: "Put on hold" }, { next: "completed", label: "Mark complete" }],
  on_hold:  [{ next: "active", label: "Resume" }],
};

function StatusBadge({ status }: { status: string }) {
  const [bg, fg] = STATUS_COLORS[status] ?? ["#f3f4f6", "#4b5563"];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>
        {status.replace(/_/g, " ")}
      </Text>
    </View>
  );
}

function KPICard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const { data: project, isLoading } = useProject(id);
  const { data: milestones } = useMilestones(id);
  const { data: sites } = useSites(id);
  const { data: versions } = useBudgetVersions(id);
  const { data: procStats } = useProcurementStats(id);
  const { data: siteOpsSummary } = useSiteOpsSummary(id);
  const { data: financeSummary } = useFinanceSummary(id);
  const updateStatus = useUpdateProjectStatus();

  const approvedVersion = versions?.find((v: any) => v.status === "approved") ?? versions?.[0];

  const handleStatusChange = (next: string, label: string) => {
    Alert.alert(
      "Update status",
      `Change project status to "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateStatus.mutate({ projectId: id, status: next }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const transitions = STATUS_TRANSITIONS[project.status] ?? [];
  const completedMilestones = milestones?.filter((m: any) => m.status === "completed").length ?? 0;
  const totalMilestones = milestones?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Projects</Text>
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <View style={styles.headerLeft}>
            <Text style={styles.projectName} numberOfLines={2}>{project.name}</Text>
            <Text style={styles.projectMeta}>
              {project.code}{project.city ? ` · ${project.city}` : ""}
            </Text>
          </View>
          <StatusBadge status={project.status} />
        </View>

        {/* Status actions */}
        {transitions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
            {transitions.map(({ next, label }) => (
              <TouchableOpacity
                key={next}
                style={styles.actionBtn}
                onPress={() => handleStatusChange(next, label)}
                disabled={updateStatus.isPending}
              >
                <Text style={styles.actionBtnText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* KPI strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.kpiScroll}
        contentContainerStyle={styles.kpiContainer}
      >
        <KPICard label="Progress" value={`${project.progress_percentage}%`} color="#2563eb" />
        <KPICard
          label="Budget"
          value={project.estimated_budget
            ? `NPR ${(project.estimated_budget / 1_000_000).toFixed(1)}M`
            : "—"}
        />
        <KPICard
          label="BOQ total"
          value={approvedVersion
            ? `NPR ${(approvedVersion.grand_total / 1_000_000).toFixed(1)}M`
            : "—"}
          color="#7c3aed"
        />
        <KPICard
          label="Milestones"
          value={`${completedMilestones}/${totalMilestones}`}
          color="#10b981"
        />
        <KPICard
          label="Open POs"
          value={String(procStats?.total_pos ?? "—")}
        />
        <KPICard
          label="Outstanding"
          value={financeSummary
            ? `NPR ${(financeSummary.total_outstanding / 1_000_000).toFixed(1)}M`
            : "—"}
          color={financeSummary?.total_outstanding > 0 ? "#ef4444" : "#10b981"}
        />
      </ScrollView>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${project.progress_percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>{project.progress_percentage}%</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Overview ── */}
        {activeTab === "Overview" && (
          <View>
            {/* Project info */}
            <SectionHeader title="Project details" />
            <View style={styles.infoCard}>
              {[
                ["Type", project.project_type?.replace(/_/g, " ")],
                ["Client", project.client_name ?? "—"],
                ["City", project.city ?? "—"],
                ["District", project.district ?? "—"],
                ["Start date", project.planned_start_date ?? "—"],
                ["End date", project.planned_end_date ?? "—"],
                ["Currency", project.currency],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Milestones */}
            {totalMilestones > 0 && (
              <>
                <SectionHeader title={`Milestones (${completedMilestones}/${totalMilestones} done)`} />
                <View style={styles.infoCard}>
                  {milestones?.slice(0, 8).map((m: any) => (
                    <View key={m.id} style={styles.milestoneRow}>
                      <View style={[
                        styles.milestoneDot,
                        { backgroundColor: MILESTONE_COLORS[m.status] ?? "#9ca3af" }
                      ]} />
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneName} numberOfLines={1}>{m.name}</Text>
                        {m.planned_date && (
                          <Text style={styles.milestoneDate}>{m.planned_date}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.milestoneBadge,
                        { backgroundColor: MILESTONE_COLORS[m.status] + "22" }
                      ]}>
                        <Text style={[
                          styles.milestoneBadgeText,
                          { color: MILESTONE_COLORS[m.status] ?? "#9ca3af" }
                        ]}>
                          {m.status.replace(/_/g, " ")}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Description */}
            {project.description && (
              <>
                <SectionHeader title="Description" />
                <View style={styles.infoCard}>
                  <Text style={styles.descText}>{project.description}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Sites ── */}
        {activeTab === "Sites" && (
          <View>
            <SectionHeader title={`Sites (${sites?.length ?? 0})`} />
            {!sites?.length ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No sites added yet</Text>
              </View>
            ) : sites.map((s: any) => (
              <View key={s.id} style={styles.listCard}>
                <View style={styles.listCardLeft}>
                  <Text style={styles.listCardTitle}>{s.name}</Text>
                  <Text style={styles.listCardSub}>
                    {s.code}{s.city ? ` · ${s.city}` : ""}
                    {s.district ? `, ${s.district}` : ""}
                  </Text>
                </View>
                <StatusBadge status={s.status} />
              </View>
            ))}
          </View>
        )}

        {/* ── BOQ ── */}
        {activeTab === "BOQ" && (
          <View>
            {!versions?.length ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No budget versions yet</Text>
              </View>
            ) : versions.map((v: any) => (
              <View key={v.id} style={styles.infoCard}>
                <View style={styles.versionHeader}>
                  <Text style={styles.versionTitle}>v{v.version_number} — {v.name}</Text>
                  <StatusBadge status={v.status} />
                </View>
                <View style={styles.budgetGrid}>
                  {[
                    { label: "Grand total", value: `NPR ${(v.grand_total / 1_000_000).toFixed(2)}M`, color: "#1d4ed8" },
                    { label: "Material", value: `NPR ${(v.total_material_cost / 1_000_000).toFixed(2)}M`, color: "#2563eb" },
                    { label: "Labour", value: `NPR ${(v.total_labour_cost / 1_000_000).toFixed(2)}M`, color: "#10b981" },
                    { label: "Contingency", value: `NPR ${(v.contingency_amount / 1_000_000).toFixed(2)}M`, color: "#7c3aed" },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={styles.budgetBox}>
                      <Text style={styles.budgetBoxLabel}>{label}</Text>
                      <Text style={[styles.budgetBoxValue, { color }]}>{value}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.budgetBarWrap}>
                  <Text style={styles.budgetBarLabel}>Contingency: {v.contingency_percentage}%</Text>
                  <View style={styles.budgetBarBg}>
                    <View style={[styles.budgetBarFill, {
                      width: `${Math.min((v.total_amount / (v.grand_total || 1)) * 100, 100)}%`
                    }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Finance ── */}
        {activeTab === "Finance" && (
          <View>
            <SectionHeader title="Financial summary" />
            {!financeSummary ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No financial data yet</Text>
              </View>
            ) : (
              <>
                <View style={styles.financeGrid}>
                  {[
                    { label: "Total invoiced", value: `NPR ${(financeSummary.total_invoiced / 1_000_000).toFixed(2)}M`, color: "#2563eb" },
                    { label: "Total received", value: `NPR ${(financeSummary.total_received / 1_000_000).toFixed(2)}M`, color: "#10b981" },
                    { label: "Outstanding", value: `NPR ${(financeSummary.total_outstanding / 1_000_000).toFixed(2)}M`, color: "#ef4444" },
                    { label: "Expenses", value: `NPR ${(financeSummary.total_expenses / 1_000_000).toFixed(2)}M`, color: "#7c3aed" },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={styles.financeBox}>
                      <Text style={styles.financeLabel}>{label}</Text>
                      <Text style={[styles.financeValue, { color }]}>{value}</Text>
                    </View>
                  ))}
                </View>

                {/* Collection rate */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Collection rate</Text>
                  <View style={styles.collectionBar}>
                    <View style={[styles.collectionFill, {
                      width: `${financeSummary.total_invoiced > 0
                        ? Math.round((financeSummary.total_received / financeSummary.total_invoiced) * 100)
                        : 0}%`
                    }]} />
                  </View>
                  <Text style={styles.collectionPct}>
                    {financeSummary.total_invoiced > 0
                      ? Math.round((financeSummary.total_received / financeSummary.total_invoiced) * 100)
                      : 0}% collected
                  </Text>
                </View>

                {/* Alert pills */}
                <View style={styles.alertRow}>
                  {financeSummary.overdue_invoices > 0 && (
                    <View style={styles.alertPill}>
                      <Text style={styles.alertPillText}>
                        ⚠️ {financeSummary.overdue_invoices} overdue invoice{financeSummary.overdue_invoices > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                  {financeSummary.pending_approval > 0 && (
                    <View style={[styles.alertPill, styles.alertPillAmber]}>
                      <Text style={[styles.alertPillText, styles.alertPillTextAmber]}>
                        🕐 {financeSummary.pending_approval} pending approval
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Site Ops ── */}
        {activeTab === "Site Ops" && (
          <View>
            <SectionHeader title="Site operations summary" />
            {!siteOpsSummary ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No site ops data yet</Text>
              </View>
            ) : (
              <View style={styles.infoCard}>
                {[
                  ["Total DPRs", String(siteOpsSummary.total_dprs)],
                  ["Submitted DPRs", String(siteOpsSummary.submitted_dprs)],
                  ["Total worker days", String(siteOpsSummary.total_worker_days)],
                  ["Total labour cost", `NPR ${Number(siteOpsSummary.total_labour_cost).toLocaleString()}`],
                ].map(([label, value]) => (
                  <View key={label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Quick actions */}
            <SectionHeader title="Quick actions" />
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/dpr" as any)}
              >
                <Text style={styles.quickBtnIcon}>📋</Text>
                <Text style={styles.quickBtnText}>Submit DPR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/material-request" as any)}
              >
                <Text style={styles.quickBtnIcon}>📦</Text>
                <Text style={styles.quickBtnText}>Material Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => router.push("/(app)/expense" as any)}
              >
                <Text style={styles.quickBtnIcon}>🧾</Text>
                <Text style={styles.quickBtnText}>Log Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  backBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: "#fff", fontWeight: "600" },

  header: { backgroundColor: "#fff", padding: 16, paddingTop: 12, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  backArrow: { fontSize: 18, color: "#2563eb" },
  backText: { fontSize: 14, color: "#2563eb" },
  headerMain: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerLeft: { flex: 1 },
  projectName: { fontSize: 18, fontWeight: "700", color: "#111827", lineHeight: 24 },
  projectMeta: { fontSize: 12, color: "#6b7280", marginTop: 3 },
  actionsRow: { marginTop: 10 },
  actionBtn: {
    backgroundColor: "#eff6ff", borderRadius: 8, borderWidth: 1,
    borderColor: "#bfdbfe", paddingHorizontal: 12, paddingVertical: 7,
    marginRight: 8,
  },
  actionBtnText: { fontSize: 13, color: "#1d4ed8", fontWeight: "500" },

  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  kpiScroll: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  kpiContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  kpiCard: {
    backgroundColor: "#f8fafc", borderRadius: 10, padding: 10,
    minWidth: 90, alignItems: "center",
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  kpiLabel: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: "700", color: "#111827" },

  progressWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb",
  },
  progressBg: { flex: 1, height: 6, backgroundColor: "#e5e7eb", borderRadius: 99 },
  progressFill: { height: 6, backgroundColor: "#2563eb", borderRadius: 99 },
  progressPct: { fontSize: 12, fontWeight: "600", color: "#2563eb", width: 36, textAlign: "right" },

  tabsScroll: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", flexGrow: 0 },
  tabsContainer: { paddingHorizontal: 12, paddingVertical: 0 },
  tab: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#2563eb" },

  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },

  sectionHeader: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8, marginLeft: 2 },

  infoCard: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    borderWidth: 0.5, borderColor: "#e5e7eb", marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6",
  },
  infoLabel: { fontSize: 13, color: "#6b7280" },
  infoValue: { fontSize: 13, fontWeight: "500", color: "#111827", textTransform: "capitalize" },
  descText: { fontSize: 14, color: "#374151", lineHeight: 22, padding: 14 },

  emptyCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 32,
    alignItems: "center", borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  emptyText: { fontSize: 14, color: "#9ca3af" },

  listCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 8, borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  listCardLeft: { flex: 1, marginRight: 12 },
  listCardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  listCardSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  milestoneRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", gap: 10,
  },
  milestoneDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  milestoneInfo: { flex: 1 },
  milestoneName: { fontSize: 13, color: "#111827", fontWeight: "500" },
  milestoneDate: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  milestoneBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  milestoneBadgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },

  versionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6",
  },
  versionTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  budgetGrid: { flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 8 },
  budgetBox: {
    width: "47%", backgroundColor: "#f8fafc", borderRadius: 10,
    padding: 10, borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  budgetBoxLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  budgetBoxValue: { fontSize: 14, fontWeight: "700" },
  budgetBarWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  budgetBarLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 6 },
  budgetBarBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 99 },
  budgetBarFill: { height: 6, backgroundColor: "#2563eb", borderRadius: 99 },

  financeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  financeBox: {
    width: "47.5%", backgroundColor: "#fff", borderRadius: 12, padding: 12,
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  financeLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  financeValue: { fontSize: 15, fontWeight: "700" },
  collectionBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 99, marginVertical: 10 },
  collectionFill: { height: 8, backgroundColor: "#10b981", borderRadius: 99 },
  collectionPct: { fontSize: 12, color: "#10b981", fontWeight: "600" },
  alertRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  alertPill: {
    backgroundColor: "#fee2e2", borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  alertPillAmber: { backgroundColor: "#fef3c7" },
  alertPillText: { fontSize: 12, color: "#dc2626", fontWeight: "500" },
  alertPillTextAmber: { color: "#92400e" },

  quickActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  quickBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12,
    padding: 14, alignItems: "center", gap: 6,
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  quickBtnIcon: { fontSize: 24 },
  quickBtnText: { fontSize: 11, color: "#374151", fontWeight: "500", textAlign: "center" },
});