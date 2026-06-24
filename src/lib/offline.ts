import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { apiClient } from "@/src/lib/api";

const QUEUE_KEY = "offline_mutation_queue";
const CACHE_PREFIX = "query_cache_";
const CACHE_KEYS_KEY = "cached_query_keys";

export interface QueuedMutation {
  id: string;
  method: "post" | "patch" | "put" | "delete";
  url: string;
  data?: any;
  config?: Record<string, any>;
  createdAt: string;
  label: string;
}

// ── Network status ───────────────────────────────────────────────

let _isOnline = true;
let _listeners: ((online: boolean) => void)[] = [];

export function onNetworkChange(fn: (online: boolean) => void) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

export function isOnline() {
  return _isOnline;
}

async function checkNetwork(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  } catch {
    return false;
  }
}

let _unsubscribe: (() => void) | null = null;
export function startNetworkMonitor(_intervalMs?: number) {
  if (_unsubscribe) _unsubscribe();
  _unsubscribe = NetInfo.addEventListener((state) => {
    const online = state.isConnected ?? true;
    if (online !== _isOnline) {
      _isOnline = online;
      _listeners.forEach((fn) => fn(online));
      if (online) processQueue();
    }
  });
}

export function stopNetworkMonitor() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}

// ── Mutation Queue ───────────────────────────────────────────────

export async function addToQueue(
  mutation: Omit<QueuedMutation, "id" | "createdAt">
): Promise<void> {
  const queue = await getQueue();
  const entry: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(queue.filter((m) => m.id !== id))
  );
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}

export async function processQueue(): Promise<{
  completed: number;
  failed: { id: string; label: string; error: string }[];
}> {
  if (!_isOnline) return { completed: 0, failed: [] };
  const queue = await getQueue();
  if (!queue.length) return { completed: 0, failed: [] };

  let completed = 0;
  const failed: { id: string; label: string; error: string }[] = [];

  for (const mutation of queue) {
    try {
      const method = mutation.method as keyof typeof apiClient;
      if (method === "delete") {
        await (apiClient as any).delete(mutation.url, {
          data: mutation.data,
          ...mutation.config,
        });
      } else {
        await (apiClient as any)[method](mutation.url, mutation.data, mutation.config);
      }
      await removeFromQueue(mutation.id);
      completed++;
    } catch (e: any) {
      if (e?.response?.status && e.response.status < 500) {
        await removeFromQueue(mutation.id);
      }
      failed.push({
        id: mutation.id,
        label: mutation.label,
        error: e?.response?.data?.message ?? e?.message ?? "Unknown error",
      });
    }
  }

  return { completed, failed };
}

// ── Query cache persistence ──────────────────────────────────────

export async function cacheQueryData(
  key: string,
  data: any
): Promise<void> {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  const keysRaw = await AsyncStorage.getItem(CACHE_KEYS_KEY);
  const keys: string[] = keysRaw ? JSON.parse(keysRaw) : [];
  if (!keys.includes(key)) {
    keys.push(key);
    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(keys));
  }
}

export async function getCachedQueryData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAllCachedQueries(): Promise<void> {
  const keysRaw = await AsyncStorage.getItem(CACHE_KEYS_KEY);
  const keys: string[] = keysRaw ? JSON.parse(keysRaw) : [];
  const allKeys = keys.map((k) => `${CACHE_PREFIX}${k}`);
  if (allKeys.length) await AsyncStorage.multiRemove(allKeys);
  await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify([]));
}
