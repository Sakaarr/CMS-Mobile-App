import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Switch,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useCreateExpense } from "@/src/hooks/useFinance";

const CATEGORIES = [
  "material", "labour", "equipment",
  "transport", "office", "utilities",
  "professional", "miscellaneous",
];

export default function ExpenseScreen() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [step, setStep] = useState<"select" | "form" | "done">("select");
  const [expenseNumber, setExpenseNumber] = useState("");

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Log Expense</Text>
        <Text style={styles.sub}>Select project</Text>
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
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Expense logged!</Text>
        <Text style={styles.successSub}>{expenseNumber}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => { setStep("select"); setSelectedProject(null); }}
        >
          <Text style={styles.btnText}>Log another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ExpenseForm
      project={selectedProject}
      onBack={() => setStep("select")}
      onSuccess={(num) => { setExpenseNumber(num); setStep("done"); }}
    />
  );
}

function ExpenseForm({ project, onBack, onSuccess }: {
  project: any;
  onBack: () => void;
  onSuccess: (num: string) => void;
}) {
  const createExpense = useCreateExpense(project.id);
  const today = new Date().toISOString().split("T")[0];

  const [category, setCategory] = useState("material");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(today);
  const [vendorName, setVendorName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [includeVat, setIncludeVat] = useState(false);
  const [notes, setNotes] = useState("");

  const vatAmount = includeVat ? Math.round(parseFloat(amount || "0") * 0.13) : 0;
  const total = parseFloat(amount || "0") + vatAmount;

  const submit = async () => {
    if (!description || !amount) {
      Alert.alert("Error", "Description and amount are required");
      return;
    }
    try {
      const res = await createExpense.mutateAsync({
        category,
        description,
        amount: parseFloat(amount),
        expense_date: expenseDate,
        vendor_name: vendorName || undefined,
        pan_number: panNumber || undefined,
        include_vat: includeVat,
        notes: notes || undefined,
      });
      onSuccess(res.data.data.expense_number);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to log expense");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Log Expense</Text>
      <Text style={styles.sub}>{project.name}</Text>

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fields */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Cement purchase for floor slab"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Amount (NPR)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={expenseDate}
            onChangeText={setExpenseDate}
          />
        </View>
      </View>

      <Text style={styles.label}>Vendor name (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Supplier / contractor name"
        value={vendorName}
        onChangeText={setVendorName}
      />

      <Text style={styles.label}>PAN number (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="For VAT invoice"
        value={panNumber}
        onChangeText={setPanNumber}
        keyboardType="numeric"
      />

      {/* VAT toggle */}
      <View style={styles.vatRow}>
        <View>
          <Text style={styles.label}>Include VAT (13%)</Text>
          {includeVat && (
            <Text style={styles.vatText}>
              VAT: NPR {vatAmount.toLocaleString()} | Total: NPR {total.toLocaleString()}
            </Text>
          )}
        </View>
        <Switch
          value={includeVat}
          onValueChange={setIncludeVat}
          trackColor={{ true: "#2563eb" }}
        />
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        numberOfLines={3}
        placeholder="Additional notes..."
        value={notes}
        onChangeText={setNotes}
      />

      {/* Total preview */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total amount</Text>
        <Text style={styles.totalValue}>NPR {total.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, createExpense.isPending && styles.btnDisabled]}
        onPress={submit}
        disabled={createExpense.isPending}
      >
        {createExpense.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Log Expense</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  back: { marginBottom: 12 },
  backText: { color: "#2563eb", fontSize: 14 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 10, borderLeftWidth: 4, borderLeftColor: "#2563eb",
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginTop: 14, marginBottom: 6 },
  chipRow: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1, borderColor: "#d1d5db",
    backgroundColor: "#fff", marginRight: 8,
  },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#4b5563", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  row: { flexDirection: "row" },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: "#111827", backgroundColor: "#fff",
  },
  textarea: { height: 72, textAlignVertical: "top" },
  vatRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 14,
    backgroundColor: "#fff", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "#e5e7eb",
  },
  vatText: { fontSize: 12, color: "#2563eb", marginTop: 2 },
  totalBox: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", backgroundColor: "#eff6ff",
    borderRadius: 10, padding: 14, marginTop: 20,
    borderWidth: 1, borderColor: "#bfdbfe",
  },
  totalLabel: { fontSize: 14, fontWeight: "600", color: "#1e40af" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#1d4ed8" },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successIcon: { fontSize: 52, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  successSub: { fontSize: 13, color: "#6b7280", marginBottom: 24 },
});