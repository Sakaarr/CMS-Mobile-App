import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { apiClient } from "@/src/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { setItem } from "@/src/lib/storage";

export default function ChangePasswordScreen() {
  const { setAuth, tenantSlug } = useAuthStore();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!current || !next || !confirm) {
      setError("All fields are required");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(next)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(next)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });
      // Refresh user
      const meRes = await apiClient.get("/auth/me");
      const user = meRes.data.data;
      await setItem("user", JSON.stringify(user));
      setAuth(user, tenantSlug!);
      router.replace("/(app)/overview");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔑</Text>
        </View>
        <Text style={styles.title}>Set your password</Text>
        <Text style={styles.sub}>
          Your account was created with a temporary password.{"\n"}
          Please set a permanent password to continue.
        </Text>

        <View style={styles.card}>
          <Field label="Temporary password" value={current} onChangeText={setCurrent} secureTextEntry />
          <Field label="New password" value={next} onChangeText={setNext} secureTextEntry placeholder="Min 8 chars, 1 uppercase, 1 number" />
          <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Set password & continue</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string; [key: string]: any }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
  iconBox: { alignItems: "center", marginBottom: 16 },
  icon: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  sub: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8, marginBottom: 28, lineHeight: 22 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    height: 44, borderWidth: 1, borderColor: "#d1d5db",
    borderRadius: 10, paddingHorizontal: 12,
    fontSize: 14, backgroundColor: "#fff", color: "#111827",
  },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 10,
    height: 48, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
