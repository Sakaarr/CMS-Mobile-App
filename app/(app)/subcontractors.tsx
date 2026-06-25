import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useSubcontractors, useCreateSubcontractor } from "@/src/hooks/useSubcontractors";

const SPECIALTIES = [
  "structural", "electrical", "plumbing", "hvac",
  "finishing", "roofing", "painting", "landscaping", "general", "other",
];

export default function SubcontractorsScreen() {
  const [search, setSearch] = useState("");
  const { data: subcontractors, isLoading } = useSubcontractors(search || undefined);
  const createSub = useCreateSubcontractor();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [specialty, setSpecialty] = useState("general");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !code) {
      Alert.alert("Error", "Name and code are required");
      return;
    }
    setSubmitting(true);
    try {
      await createSub.mutateAsync({ name, code, specialty, contact_person: contactPerson || undefined, email: email || undefined, phone: phone || undefined, city: city || undefined });
      setName(""); setCode(""); setSpecialty("general"); setContactPerson(""); setEmail(""); setPhone(""); setCity("");
      setShowForm(false);
    } catch {
      Alert.alert("Error", "Failed to create subcontractor");
    }
    setSubmitting(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Subcontractors</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search subcontractors..."
        value={search}
        onChangeText={setSearch}
      />

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Subcontractor</Text>
          <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Code *" value={code} onChangeText={setCode} />
          <View style={styles.chipRow}>
            {SPECIALTIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, specialty === s && styles.chipActive]}
                onPress={() => setSpecialty(s)}
              >
                <Text style={[styles.chipText, specialty === s && styles.chipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Contact person" value={contactPerson} onChangeText={setContactPerson} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : !subcontractors?.length ? (
        <Text style={styles.empty}>No subcontractors found</Text>
      ) : (
        subcontractors.map((sub: any) => (
          <View key={sub.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{sub.name}</Text>
              <View style={[styles.statusBadge, sub.status === "active" ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, sub.status === "active" ? styles.activeText : styles.inactiveText]}>
                  {sub.status}
                </Text>
              </View>
            </View>
            <Text style={styles.cardCode}>{sub.code} · {sub.specialty}</Text>
            {(sub.contact_person || sub.city) && (
              <Text style={styles.cardMeta}>
                {[sub.contact_person, sub.city].filter(Boolean).join(" · ")}
              </Text>
            )}
            <View style={styles.cardFooter}>
              <Text style={styles.rating}>★ {sub.rating.toFixed(1)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  searchInput: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: "#fff", marginBottom: 16,
  },
  form: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, gap: 10 },
  formTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: "#f9fafb",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb",
  },
  chipActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#6b7280" },
  chipTextActive: { color: "#2563eb", fontWeight: "500" },
  submitBtn: {
    backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 12,
    alignItems: "center", marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 15 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03,
    shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadge: { backgroundColor: "#dcfce7" },
  inactiveBadge: { backgroundColor: "#f3f4f6" },
  statusText: { fontSize: 11, fontWeight: "500" },
  activeText: { color: "#16a34a" },
  inactiveText: { color: "#6b7280" },
  cardCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  cardFooter: { flexDirection: "row", marginTop: 8 },
  rating: { fontSize: 12, color: "#f59e0b", fontWeight: "500" },
});
