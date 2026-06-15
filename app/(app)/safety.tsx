import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useCreateIncident, useCreateNCR } from "@/src/hooks/useQuality";

const INCIDENT_SEVERITIES = ["near_miss", "minor", "moderate", "major", "fatal"];
const NCR_SEVERITIES = ["low", "medium", "high", "critical"];

export default function SafetyScreen() {
  const { data: projects } = useProjects();
  const [mode, setMode] = useState<"select" | "incident" | "ncr" | "done">("select");
  const [reportType, setReportType] = useState<"incident" | "ncr">("incident");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [doneMessage, setDoneMessage] = useState("");

  if (mode === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Report Incident</Text>
      <Text style={styles.sub}>{project.name}</Text>

      <Text style={styles.sectionLabel}>Severity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {INCIDENT_SEVERITIES.map(s => (
          <TouchableOpacity
            key={s}
            style={[
              styles.chip,
              severity === s && styles.chipActive,
              (s === "major" || s === "fatal") && styles.chipDanger,
              (s === "major" || s === "fatal") && severity === s && styles.chipDangerActive,
            ]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[
              styles.chipText,
              severity === s && styles.chipTextActive,
            ]}>
              {s.replace(/_/g, " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Title</Text>
      <TextInput style={styles.input} placeholder="Brief incident title" value={title} onChangeText={setTitle} />

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline numberOfLines={3}
        placeholder="What happened? Include details..."
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.sectionLabel}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Block A, Level 3" value={location} onChangeText={setLocation} />

      <Text style={styles.sectionLabel}>Number of injuries</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={injuries} onChangeText={setInjuries} />

      <Text style={styles.sectionLabel}>Immediate action taken</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline numberOfLines={3}
        placeholder="What was done immediately after the incident?"
        value={immediateAction}
        onChangeText={setImmediateAction}
      />

      {(severity === "major" || severity === "fatal") && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ This incident will be flagged as reportable due to its severity
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.btnDanger, createIncident.isPending && styles.btnDisabled]}
        onPress={submit}
        disabled={createIncident.isPending}
      >
        {createIncident.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Report Incident</Text>
        }
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
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Raise NCR</Text>
      <Text style={styles.sub}>{project.name}</Text>

      <Text style={styles.sectionLabel}>Severity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {NCR_SEVERITIES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, severity === s && styles.chipActive]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[styles.chipText, severity === s && styles.chipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Title</Text>
      <TextInput style={styles.input} placeholder="Non-conformance title" value={title} onChangeText={setTitle} />

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline numberOfLines={4}
        placeholder="Describe the non-conformance in detail..."
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.sectionLabel}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Block B, Column C3" value={location} onChangeText={setLocation} />

      <TouchableOpacity
        style={[styles.btn, createNCR.isPending && styles.btnDisabled]}
        onPress={submit}
        disabled={createNCR.isPending}
      >
        {createNCR.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Raise NCR</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
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
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff", marginRight: 8 },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipDanger: { borderColor: "#fca5a5" },
  chipDangerActive: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  chipText: { fontSize: 12, color: "#4b5563", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  back: { marginBottom: 12 },
  backText: { color: "#2563eb", fontSize: 14 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#111827", backgroundColor: "#fff" },
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
});