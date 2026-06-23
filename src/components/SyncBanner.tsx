import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getQueue, processQueue, isOnline, onNetworkChange } from "@/src/lib/offline";

export function SyncBanner() {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const check = async () => {
      const q = await getQueue();
      setPending(q.length);
    };
    check();

    const unsub = onNetworkChange((ok) => {
      setOnline(ok);
      if (ok) check();
    });

    const interval = setInterval(check, 10_000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (pending === 0 && online) return null;

  const handleSync = async () => {
    setSyncing(true);
    await processQueue();
    const q = await getQueue();
    setPending(q.length);
    setSyncing(false);
  };

  return (
    <View style={[s.banner, online ? s.bannerPending : s.bannerOffline]}>
      <Text style={s.text}>
        {online
          ? `${pending} item${pending > 1 ? "s" : ""} pending sync`
          : "You are offline"}
      </Text>
      {online && pending > 0 && (
        <TouchableOpacity style={s.btn} onPress={handleSync} disabled={syncing}>
          <Text style={s.btnText}>{syncing ? "Syncing..." : "Sync now"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerOffline: { backgroundColor: "#f59e0b" },
  bannerPending: { backgroundColor: "#3b82f6" },
  text: { color: "#fff", fontSize: 13, fontWeight: "500" },
  btn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
