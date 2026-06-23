import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useCreateIncident, useCreateNCR, useInspections, useNCRs, usePunchList, usePassInspection, useFailInspection } from "@/src/hooks/useQuality";

const INCIDENT_SEVERITIES = ["near_miss", "minor", "moderate", "major", "fatal"];
const NCR_SEVERITIES = ["low", "medium", "high", "critical"];

type MainTab = "report" | "inspections" | "ncrs" | "punch";

export default function SafetyScreen() {
  const { data: projects } = useProjects();
  const [mainTab, setMainTab] = useState<MainTab>("report");
  const [mode, setMode] = useState<"select" | "incident" | "ncr" | "done">("select");
  const [reportType, setReportType] = useState<"incident" | "ncr">("incident");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [doneMessage, setDoneMessage] = useState("");

  // List views need a selected project too
  const { data: inspections, isLoading: loadingInsp } = useInspections(selectedProject?.id);
  const { data: ncrs, isLoading: loadingNcrs } = useNCRs(selectedProject?.id);
  const { data: punchItems, isLoading: loadingPunch } = usePunchList(selectedProject?.id);
  const passInspection = usePassInspection(selectedProject?.id);
  const failInspection = useFailInspection(selectedProject?.id);

  if (mainTab !== "report" && !selectedProject) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.tabRow}>
          {(["report", "inspections", "ncrs", "punch"] as MainTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, mainTab === t && styles.tabActive]}
              onPress={() => setMainTab(t)}
            >
              <Text style={[styles.tabText, mainTab === t && styles.tabTextActive]}>
                {t === "report" ? "⚠️ Report" : t === "inspections" ? "🔍 Inspections" : t === "ncrs" ? "📋 NCRs" : "📌 Punch"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.title}>
          {mainTab === "inspections" ? "Inspections" : mainTab === "ncrs" ? "NCRs" : "Punch List"}
        </Text>
        <Text style={styles.sub}>Select a project</Text>
        {projects?.filter((p: any) => p.status === "active").map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={styles.projectCard}
            onPress={() => setSelectedProject(p)}
          >
            <Text style={styles.projectName}>{p.name}</Text>
            <Text style={styles.projectCode}>{p.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (mainTab === "inspections" && selectedProject) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedProject(null); }} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Inspections</Text>
          <Text style={styles.sub}>{selectedProject.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {loadingInsp ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : !inspections?.length ? (
            <View style={styles.emptyState}><Text style={styles.emptyEmoji}>🔍</Text><Text style={styles.emptyText}>No inspections yet</Text></View>
          ) : inspections.map((insp: any) => {
            const statusBg = insp.status === "passed" ? "#dcfce7" : insp.status === "failed" ? "#fee2e2" : insp.status === "scheduled" ? "#dbeafe" : "#f3f4f6";
            const statusFg = insp.status === "passed" ? "#16a34a" : insp.status === "failed" ? "#dc2626" : insp.status === "scheduled" ? "#1d4ed8" : "#4b5563";
            return (
              <View key={insp.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.cardTitle}>{insp.title}</Text>
                  </View>
                  <Text style={styles.cardSub}>{insp.inspection_number} · {insp.scheduled_date} · {insp.inspector_name ?? "—"}</Text>
                  {insp.score != null && <Text style={styles.cardScore}>Score: {insp.score}%</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.badgeText, { color: statusFg }]}>{insp.status}</Text>
                  </View>
                  {insp.status === "scheduled" && (
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <TouchableOpacity
                        style={styles.smallActionBtn}
                        onPress={() => passInspection.mutateAsync(insp.id).catch(() => {})}
                      >
                        <Text style={styles.smallActionBtnText}>✅</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallActionBtn, { backgroundColor: "#fee2e2" }]}
                        onPress={() => failInspection.mutateAsync(insp.id).catch(() => {})}
                      >
                        <Text style={styles.smallActionBtnText}>❌</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (mainTab === "ncrs" && selectedProject) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedProject(null); }} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>NCRs</Text>
          <Text style={styles.sub}>{selectedProject.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {loadingNcrs ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : !ncrs?.length ? (
            <View style={styles.emptyState}><Text style={styles.emptyEmoji}>📋</Text><Text style={styles.emptyText}>No NCRs raised</Text></View>
          ) : ncrs.map((ncr: any) => {
            const sevColor = ncr.severity === "critical" ? "#ef4444" : ncr.severity === "high" ? "#f59e0b" : ncr.severity === "medium" ? "#3b82f6" : "#6b7280";
            return (
              <View key={ncr.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{ncr.title}</Text>
                  <Text style={styles.cardSub}>{ncr.ncr_number} · {ncr.location ?? "—"}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: sevColor + "22" }]}>
                    <Text style={[styles.badgeText, { color: sevColor }]}>{ncr.severity}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: ncr.status === "open" ? "#fef9c3" : ncr.status === "closed" ? "#dcfce7" : "#dbeafe" }]}>
                    <Text style={[styles.badgeText, { color: ncr.status === "open" ? "#a16207" : ncr.status === "closed" ? "#16a34a" : "#1d4ed8" }]}>
                      {ncr.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (mainTab === "punch" && selectedProject) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedProject(null); }} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Punch List</Text>
          <Text style={styles.sub}>{selectedProject.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {loadingPunch ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : !punchItems?.length ? (
            <View style={styles.emptyState}><Text style={styles.emptyEmoji}>📌</Text><Text style={styles.emptyText}>No punch items</Text></View>
          ) : punchItems.map((item: any) => (
            <View key={item.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.description}</Text>
                <Text style={styles.cardSub}>{item.item_number} · {item.location ?? "—"} · Due: {item.due_date ?? "—"}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={[styles.badge, {
                  backgroundColor: item.priority === "high" || item.priority === "critical" ? "#fee2e2" : item.priority === "medium" ? "#fef9c3" : "#f3f4f6"
                }]}>
                  <Text style={[styles.badgeText, { color: item.priority === "high" || item.priority === "critical" ? "#dc2626" : item.priority === "medium" ? "#a16207" : "#4b5563" }]}>
                    {item.priority}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.status === "open" ? "#dbeafe" : item.status === "completed" ? "#dcfce7" : "#f3f4f6" }]}>
                  <Text style={[styles.badgeText, { color: item.status === "open" ? "#1d4ed8" : item.status === "completed" ? "#16a34a" : "#4b5563" }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Original "report" flow (unchanged) ──
  if (mode === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.tabRow}>
          {(["report", "inspections", "ncrs", "punch"] as MainTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, mainTab === t && styles.tabActive]}
              onPress={() => {
                setMainTab(t);
                if (t !== "report") setSelectedProject(null);
              }}
            >
              <Text style={[styles.tabText, mainTab === t && styles.tabTextActive]}>
                {t === "report" ? "⚠️ Report" : t === "inspections" ? "🔍 Inspections" : t === "ncrs" ? "📋 NCRs" : "📌 Punch"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.title}>Safety & Quality</Text>
        <Text style={styles.sub}>Report an incident or raise an NCR</Text>

        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, reportType === "incident" && styles.typeBtnActive]}
            onPress={() => setReportType("incident")}
          >
            <Text style={styles.typeEmoji}>⚠️</Text>
            <Text style={[styles.typeBtnText, reportType === "incident" && styles.typeBtnTextActive]}>
              Safety incident
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, reportType === "ncr" && styles.typeBtnActive]}
            onPress={() => setReportType("ncr")}
          >
            <Text style={styles.typeEmoji}>📋</Text>
            <Text style={[styles.typeBtnText, reportType === "ncr" && styles.typeBtnTextActive]}>
              NCR
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Select project</Text>
        {projects?.filter((p: any) => p.status === "active").map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={styles.projectCard}
            onPress={() => {
              setSelectedProject(p);
              setMode(reportType);
            }}
          >
            <Text style={styles.projectName}>{p.name}</Text>
            <Text style={styles.projectCode}>{p.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (mode === "done") {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Reported successfully</Text>
        <Text style={styles.successSub}>{doneMessage}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => { setMode("select"); setSelectedProject(null); }}
        >
          <Text style={styles.btnText}>Report another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === "incident") {
    return (
      <IncidentForm
        project={selectedProject}
        onBack={() => setMode("select")}
        onSuccess={(num) => { setDoneMessage(num); setMode("done"); }}
      />
    );
  }

  return (
    <NCRForm
      project={selectedProject}
      onBack={() => setMode("select")}
      onSuccess={(num) => { setDoneMessage(num); setMode("done"); }}
    />
  );
}

function IncidentForm({ project, onBack, onSuccess }: any) {
  const createIncident = useCreateIncident(project.id);
  const today = new Date().toISOString().split("T")[0];
  const [severity, setSeverity] = useState("near_miss");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [injuries, setInjuries] = useState("0");
  const [immediateAction, setImmediateAction] = useState("");

  const submit = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Title and description are required");
      return;
    }
    try {
      const res = await createIncident.mutateAsync({
        title, description, severity,
        incident_date: today,
        location: location || undefined,
        injuries: parseInt(injuries) || 0,
        immediate_action: immediateAction || undefined,
        persons_involved: 1,
        fatalities: 0,
        property_damage: 0,
        is_reportable: severity === "major" || severity === "fatal",
      });
      onSuccess(res.data.data.incident_number);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to report incident");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Report Incident</Text>
      <Text style={styles.sub}>{project.name}</Text>

      <Text style={styles.sectionLabel}>Severity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {INCIDENT_SEVERITIES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, severity === s && styles.chipActive, (s === "major" || s === "fatal") && styles.chipDanger, (s === "major" || s === "fatal") && severity === s && styles.chipDangerActive]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>{s.replace(/_/g, " ")}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Title</Text>
      <TextInput style={styles.input} placeholder="Brief incident title" value={title} onChangeText={setTitle} />

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput style={[styles.input, styles.textarea]} multiline numberOfLines={3} placeholder="What happened? Include details..." value={description} onChangeText={setDescription} />

      <Text style={styles.sectionLabel}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Block A, Level 3" value={location} onChangeText={setLocation} />

      <Text style={styles.sectionLabel}>Number of injuries</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={injuries} onChangeText={setInjuries} />

      <Text style={styles.sectionLabel}>Immediate action taken</Text>
      <TextInput style={[styles.input, styles.textarea]} multiline numberOfLines={3} placeholder="What was done immediately after the incident?" value={immediateAction} onChangeText={setImmediateAction} />

      {(severity === "major" || severity === "fatal") && (
        <View style={styles.warningBox}><Text style={styles.warningText}>⚠️ This incident will be flagged as reportable due to its severity</Text></View>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnDanger, createIncident.isPending && styles.btnDisabled]} onPress={submit} disabled={createIncident.isPending}>
        {createIncident.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Report Incident</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function NCRForm({ project, onBack, onSuccess }: any) {
  const createNCR = useCreateNCR(project.id);
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const submit = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Title and description are required");
      return;
    }
    try {
      const res = await createNCR.mutateAsync({
        title, description, severity,
        location: location || undefined,
      });
      onSuccess(res.data.data.ncr_number);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to raise NCR");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Raise NCR</Text>
      <Text style={styles.sub}>{project.name}</Text>

      <Text style={styles.sectionLabel}>Severity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {NCR_SEVERITIES.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, severity === s && styles.chipActive]} onPress={() => setSeverity(s)}>
            <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Title</Text>
      <TextInput style={styles.input} placeholder="Non-conformance title" value={title} onChangeText={setTitle} />

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput style={[styles.input, styles.textarea]} multiline numberOfLines={4} placeholder="Describe the non-conformance in detail..." value={description} onChangeText={setDescription} />

      <Text style={styles.sectionLabel}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Block B, Column C3" value={location} onChangeText={setLocation} />

      <TouchableOpacity style={[styles.btn, createNCR.isPending && styles.btnDisabled]} onPress={submit} disabled={createNCR.isPending}>
        {createNCR.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Raise NCR</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 20, flexWrap: "wrap" },
  tab: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99,
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabText: { fontSize: 12, color: "#4b5563", fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  typeBtnActive: { backgroundColor: "#eff6ff", borderColor: "#3b82f6" },
  typeEmoji: { fontSize: 24, marginBottom: 6 },
  typeBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "500", textAlign: "center" },
  typeBtnTextActive: { color: "#1d4ed8" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#2563eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  chipRow: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff", marginRight: 8,
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipDanger: { borderColor: "#fca5a5" },
  chipDangerActive: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  chipText: { fontSize: 12, color: "#4b5563", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  back: { marginBottom: 12 },
  backText: { color: "#2563eb", fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
    color: "#111827", backgroundColor: "#fff",
  },
  textarea: { height: 80, textAlignVertical: "top" },
  warningBox: { backgroundColor: "#fff7ed", borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#fed7aa" },
  warningText: { fontSize: 13, color: "#c2410c" },
  btn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  btnDanger: { backgroundColor: "#ef4444" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successIcon: { fontSize: 52, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  successSub: { fontSize: 13, color: "#6b7280", marginBottom: 24 },
  listContent: { padding: 12 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 12,
    marginBottom: 8, flexDirection: "row", alignItems: "center",
    borderWidth: 0.5, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  cardScore: { fontSize: 12, color: "#2563eb", fontWeight: "500", marginTop: 1 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  smallActionBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center",
  },
  smallActionBtnText: { fontSize: 14 },
});
