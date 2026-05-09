import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from "react-native";
import { useAuthStore } from "@/src/store/auth.store";
import { useThemeStore } from "@/src/store/theme.store";
import { router } from "expo-router";

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; emoji: string }[] = [
  { value: "light", label: "Light", emoji: "☀️" },
  { value: "dark", label: "Dark", emoji: "🌙" },
  { value: "system", label: "System", emoji: "📱" },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          {user?.is_superadmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Super Admin</Text>
            </View>
          )}
        </View>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>Theme</Text>
          <Text style={styles.settingDesc}>Choose how the app looks</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeBtn,
                  theme === opt.value && styles.themeBtnActive,
                ]}
                onPress={() => setTheme(opt.value)}
              >
                <Text style={styles.themeEmoji}>{opt.emoji}</Text>
                <Text style={[
                  styles.themeBtnText,
                  theme === opt.value && styles.themeBtnTextActive,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <SettingRow label="Organisation" value={user?.is_superadmin ? "Platform admin" : "Company"} />
          <SettingRow label="Role" value={user?.is_superadmin ? "Super admin" : "Member"} />
          <SettingRow label="Status" value="Active" valueColor="#10b981" />
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <SettingRow label="Version" value="1.0.0" />
          <SettingRow label="Build" value="MVP" />
          <SettingRow label="Backend" value="FastAPI + PostgreSQL" />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingRow({ label, value, valueColor }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingRowLabel}>{label}</Text>
      <Text style={[styles.settingRowValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#dbeafe",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "600", color: "#1d4ed8" },
  profileName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  profileEmail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  adminBadge: {
    marginTop: 4, alignSelf: "flex-start",
    backgroundColor: "#fef3c7", borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 10, fontWeight: "600", color: "#92400e" },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: "600", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  settingTitle: { fontSize: 14, fontWeight: "500", color: "#111827", padding: 14, paddingBottom: 4 },
  settingDesc: { fontSize: 12, color: "#9ca3af", paddingHorizontal: 14, paddingBottom: 12 },
  themeRow: { flexDirection: "row", padding: 12, gap: 8 },
  themeBtn: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb", gap: 4,
  },
  themeBtnActive: {
    backgroundColor: "#eff6ff", borderColor: "#3b82f6",
  },
  themeEmoji: { fontSize: 20 },
  themeBtnText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  themeBtnTextActive: { color: "#1d4ed8" },
  settingRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6",
  },
  settingRowLabel: { fontSize: 14, color: "#374151" },
  settingRowValue: { fontSize: 14, color: "#9ca3af" },
  logoutBtn: {
    backgroundColor: "#fee2e2", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#dc2626" },
});