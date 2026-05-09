import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useCreateDPR } from "@/src/hooks/useSiteOps";

const WEATHER_OPTIONS = ["sunny", "cloudy", "rainy", "foggy", "stormy"];

export default function DPRScreen() {
  const { data: projects, isLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [step, setStep] = useState<"select" | "form">("select");

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Daily Progress Report</Text>
        <Text style={styles.sub}>Select a project to start today's DPR</Text>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          projects?.filter((p: any) => p.status === "active").map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={styles.projectCard}
              onPress={() => { setSelectedProject(p); setStep("form"); }}
            >
              <Text style={styles.projectName}>{p.name}</Text>
              <Text style={styles.projectCode}>{p.code}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  }

  return <DPRForm project={selectedProject} onBack={() => setStep("select")} />;
}

function DPRForm({ project, onBack }: { project: any; onBack: () => void }) {
  const createDPR = useCreateDPR(project.id);
  const today = new Date().toISOString().split("T")[0];

  const [weather, setWeather] = useState("sunny");
  const [notes, setNotes] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [workItems, setWorkItems] = useState([
    { description: "", unit: "sqm", achieved_quantity: "", remarks: "" }
  ]);
  const [attendance, setAttendance] = useState([
    { worker_name: "", trade: "", status: "present", daily_wage: "" }
  ]);

  const addWorkItem = () =>
    setWorkItems([...workItems, { description: "", unit: "sqm", achieved_quantity: "", remarks: "" }]);

  const addWorker = () =>
    setAttendance([...attendance, { worker_name: "", trade: "", status: "present", daily_wage: "" }]);

  const submit = async () => {
    const payload = {
      site_id: project.sites?.[0]?.id ?? project.id,
      report_date: today,
      weather,
      general_notes: notes,
      safety_notes: safetyNotes,
      work_items: workItems
        .filter(w => w.description)
        .map(w => ({
          ...w,
          achieved_quantity: parseFloat(w.achieved_quantity) || 0,
          planned_quantity: 0,
        })),
      attendance: attendance
        .filter(a => a.worker_name)
        .map(a => ({ ...a, daily_wage: parseFloat(a.daily_wage) || 0 })),
      equipment_logs: [],
    };

    try {
      await createDPR.mutateAsync(payload);
      Alert.alert("Success", "DPR saved successfully!", [{ text: "OK", onPress: onBack }]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to save DPR");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>DPR — {today}</Text>
      <Text style={styles.sub}>{project.name}</Text>

      {/* Weather */}
      <SectionLabel label="Weather" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {WEATHER_OPTIONS.map(w => (
          <TouchableOpacity
            key={w}
            style={[styles.chip, weather === w && styles.chipActive]}
            onPress={() => setWeather(w)}
          >
            <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>
              {w}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Work Items */}
      <SectionLabel label="Work done today" />
      {workItems.map((item, i) => (
        <View key={i} style={styles.itemCard}>
          <TextInput
            style={styles.input}
            placeholder="Description of work"
            value={item.description}
            onChangeText={v => {
              const updated = [...workItems];
              updated[i].description = v;
              setWorkItems(updated);
            }}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Qty achieved"
              keyboardType="numeric"
              value={item.achieved_quantity}
              onChangeText={v => {
                const updated = [...workItems];
                updated[i].achieved_quantity = v;
                setWorkItems(updated);
              }}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unit"
              value={item.unit}
              onChangeText={v => {
                const updated = [...workItems];
                updated[i].unit = v;
                setWorkItems(updated);
              }}
            />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addWorkItem}>
        <Text style={styles.addBtnText}>+ Add work item</Text>
      </TouchableOpacity>

      {/* Attendance */}
      <SectionLabel label="Labour attendance" />
      {attendance.map((att, i) => (
        <View key={i} style={styles.itemCard}>
          <TextInput
            style={styles.input}
            placeholder="Worker name"
            value={att.worker_name}
            onChangeText={v => {
              const updated = [...attendance];
              updated[i].worker_name = v;
              setAttendance(updated);
            }}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Trade (mason, labour...)"
              value={att.trade}
              onChangeText={v => {
                const updated = [...attendance];
                updated[i].trade = v;
                setAttendance(updated);
              }}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Daily wage"
              keyboardType="numeric"
              value={att.daily_wage}
              onChangeText={v => {
                const updated = [...attendance];
                updated[i].daily_wage = v;
                setAttendance(updated);
              }}
            />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addWorker}>
        <Text style={styles.addBtnText}>+ Add worker</Text>
      </TouchableOpacity>

      {/* Notes */}
      <SectionLabel label="General notes" />
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        numberOfLines={3}
        placeholder="Progress notes, issues, observations..."
        value={notes}
        onChangeText={setNotes}
      />

      <SectionLabel label="Safety notes" />
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        numberOfLines={3}
        placeholder="Safety observations, incidents..."
        value={safetyNotes}
        onChangeText={setSafetyNotes}
      />

      <TouchableOpacity
        style={[styles.submitBtn, createDPR.isPending && styles.btnDisabled]}
        onPress={submit}
        disabled={createDPR.isPending}
      >
        {createDPR.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Save DPR</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 12 },
  backText: { color: "#2563eb", fontSize: 14 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "#2563eb",
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sectionLabel: {
    fontSize: 13, fontWeight: "600", color: "#374151",
    marginTop: 20, marginBottom: 8,
  },
  chipRow: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: "#d1d5db",
    backgroundColor: "#fff", marginRight: 8,
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 13, color: "#4b5563", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  itemCard: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  row: { flexDirection: "row", marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: "#111827", backgroundColor: "#fff",
    marginTop: 4,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  addBtn: {
    borderWidth: 1, borderColor: "#2563eb", borderRadius: 8,
    paddingVertical: 10, alignItems: "center", marginBottom: 4,
    borderStyle: "dashed",
  },
  addBtnText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
  submitBtn: {
    backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});