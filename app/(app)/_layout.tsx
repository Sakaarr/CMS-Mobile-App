import { useAuthStore } from "@/src/store/auth.store";
import { router, Tabs } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
  overview: "📊",
  projects: "📁",
  dpr: "📋",
  "material-request": "📦",
  boq: "💰",
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
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
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
      tabBarIcon: ({ focused }) => <TabIcon name="dpr" focused={focused} />,
    }}
  />
  <Tabs.Screen
    name="boq"
    options={{
      title: "BOQ",
      tabBarIcon: ({ focused }) => <TabIcon name="boq" focused={focused} />,
    }}
  />
  <Tabs.Screen
  name="material-request"
  options={{
    title: "Materials",
    tabBarIcon: ({ focused }) => (
      <TabIcon name="material-request" focused={focused} />
    ),
  }}
/>
</Tabs>
  );
}