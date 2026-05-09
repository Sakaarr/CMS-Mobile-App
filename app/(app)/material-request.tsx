import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useCreateMR, useSubmitMR } from "@/src/hooks/useInventory";

export default function MaterialRequestScreen() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [step, setStep] = useState<"select" | "form" | "done">("select");
  const [createdMRId, setCreatedMRId] = useState<string>("");

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Material Request</Text>
        <Text style={styles.sub}>Select project to raise a request</Text>
        {projects?.filter((p: any) => p.status === "active").map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={styles.projectCard}
            onPress={() => { setSelectedProject(p); setStep("form"); }}
          >
            <Text style={styles.projectName}>{p.name}</Text>
            <Text style={styles.projectCode}>{p.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (step === "done") {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Request submitted!</Text>
        <Text style={styles.successSub}>MR #{createdMRId.slice(-8).toUpperCase()} is pending approval</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => { setStep("select"); setSelectedProject(null); }}
        >
          <Text style={styles.btnText}>New request</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <MRForm
      project={selectedProject}
      onBack={() => setStep("select")}
      onSuccess={(mrId) => { setCreatedMRId(mrId); setStep("done"); }}
    />
  );
}

function MRForm({ project, onBack, onSuccess }: {
  project: any;
  onBack: () => void;
  onSuccess: (id: string) => void;
}) {
  const createMR = useCreateMR(project.id);
  const submitMR = useSubmitMR(project.id);

  const [purpose, setPurpose] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [items, setItems] = useState([
    { material_code: "", description: "", unit: "", requested_quantity: "" }
  ]);

  const addItem = () => setItems([
    ...items,
    { material_code: "", description: "", unit: "", requested_quantity: "" }
  ]);

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const submit = async () => {
    const validItems = items.filter(i => i.description && i.requested_quantity);
    if (!validItems.length) {
      Alert.alert("Error", "Add at least one item with description and quantity");
      return;
    }

    try {
      const res = await createMR.mutateAsync({
        purpose,
        required_date: requiredDate || undefined,
        items: validItems.map(i => ({
          ...i,
          requested_quantity: parseFloat(i.requested_quantity) || 0,
        })),
      });
      const mrId = res.data.data.id;
      await submitMR.mutateAsync(mrId);
      onSuccess(mrId);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to submit request");
    }
  };

  const isLoading = createMR.isPending || submitMR.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Material Request</Text>
      <Text style={styles.sub}>{project.name}</Text>

      {/* Purpose + date */}
      <Text style={styles.sectionLabel}>Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Purpose (e.g. Foundation concrete pour)"
        value={purpose}
        onChangeText={setPurpose}
      />
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        placeholder="Required date (YYYY-MM-DD)"
        value={requiredDate}
        onChangeText={setRequiredDate}
      />

      {/* Items */}
      <Text style={styles.sectionLabel}>Materials needed</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.itemCard}>
          <Text style={styles.itemLabel}>Item {i + 1}</Text>
          <TextInput
            style={styles.input}
            placeholder="Material code (e.g. CEM-001)"
            value={item.material_code}
            onChangeText={v => updateItem(i, "material_code", v)}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, { marginTop: 6 }]}
            placeholder="Description"
            value={item.description}
            onChangeText={v => updateItem(i, "description", v)}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Qty"
              keyboardType="numeric"
              value={item.requested_quantity}
              onChangeText={v => updateItem(i, "requested_quantity", v)}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unit"
              value={item.unit}
              onChangeText={v => updateItem(i, "unit", v)}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addItem}>
        <Text style={styles.addBtnText}>+ Add material</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, isLoading && styles.btnDisabled]}
        onPress={submit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Submit Request</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  back: { marginBottom: 12 },
  backText: { color: "#2563eb", fontSize: 14 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "#2563eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  itemCard: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  itemLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  row: { flexDirection: "row", marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: "#111827", backgroundColor: "#fff",
  },
  addBtn: {
    borderWidth: 1, borderColor: "#2563eb", borderRadius: 8,
    paddingVertical: 10, alignItems: "center",
    borderStyle: "dashed", marginTop: 4, marginBottom: 8,
  },
  addBtnText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  successSub: { fontSize: 14, color: "#6b7280", marginBottom: 24, textAlign: "center" },
});