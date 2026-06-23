import { useEffect } from "react";
import { Tabs } from "expo-router";
import { useAuthStore } from "@/src/store/auth.store";
import { useThemeStore } from "@/src/store/theme.store";
import { useFetchPermissions, useHasPermission } from "@/src/hooks/usePermissions";
import { router } from "expo-router";
import { View, Text } from "react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    overview: "📊", projects: "📁", dpr: "📋",
    "material-request": "📦", expense: "🧾",
    boq: "💰", safety: "🛡️", documents: "📂",
    settings: "⚙️",
  };
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>{icons[name] ?? "📄"}</Text>
      {focused && (
        <View style={{
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: "#2563eb", marginTop: 2,
        }} />
      )}
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const { loadTheme } = useThemeStore();

  useFetchPermissions(isAuthenticated && !user?.is_superadmin);

  const canBOQ = useHasPermission("can_boq");
  const canInventory = useHasPermission("can_inventory");
  const canSiteOps = useHasPermission("can_site_ops");
  const canFinance = useHasPermission("can_finance");
  const canQuality = useHasPermission("can_quality");
  const canDocuments = useHasPermission("can_documents");

  useEffect(() => {
    loadTheme();
    if (!isAuthenticated) router.replace("/(auth)/login");
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: "#2563eb",
        tabBarStyle: { borderTopColor: "#e5e7eb" },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ focused }) => <TabIcon name="overview" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ focused }) => <TabIcon name="projects" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dpr"
        options={{
          title: "DPR",
          href: canSiteOps ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="dpr" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="material-request"
        options={{
          title: "Materials",
          href: canInventory ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="material-request" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Expenses",
          href: canFinance ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="expense" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="boq"
        options={{
          title: "BOQ",
          href: canBOQ ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="boq" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: "Safety",
          href: canQuality ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="safety" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          href: canDocuments ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="documents" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
      {/* Hidden dynamic routes */}
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
    </Tabs>
  );
}