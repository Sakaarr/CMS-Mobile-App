import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/src/hooks/useAuth";

const schema = z.object({
  tenant_slug: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const login = useLogin();
  const {
    control, handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CMS</Text>
          </View>
          <Text style={styles.title}>CMS Platform</Text>
          <Text style={styles.subtitle}>Sign in to your organisation</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Field
            label="Organisation slug"
            placeholder="e.g. my-company"
            control={control}
            name="tenant_slug"
            error={errors.tenant_slug?.message}
            autoCapitalize="none"
          />
          <Field
            label="Email"
            placeholder="you@company.com"
            control={control}
            name="email"
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            placeholder="••••••••"
            control={control}
            name="password"
            error={errors.password?.message}
            secureTextEntry
          />

          {login.error && (
            <Text style={styles.errorText}>
              Invalid credentials. Please try again.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.btn, login.isPending && styles.btnDisabled]}
            onPress={handleSubmit((d) => login.mutate(d))}
            disabled={login.isPending}
          >
            {login.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, control, name, ...inputProps }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            onChangeText={onChange}
            value={value}
            {...inputProps}
          />
        )}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoBox: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    height: 44, borderWidth: 1, borderColor: "#d1d5db",
    borderRadius: 10, paddingHorizontal: 12,
    fontSize: 14, backgroundColor: "#fff", color: "#111827",
  },
  inputError: { borderColor: "#ef4444" },
  fieldError: { fontSize: 11, color: "#ef4444", marginTop: 4 },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 10,
    height: 48, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});