import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

async function webGetItem(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

async function webSetItem(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

async function webDeleteItem(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export async function getItem(key: string) {
  if (Platform.OS === "web") return webGetItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    await webSetItem(key, value);
    return;
  }

  return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string) {
  if (Platform.OS === "web") {
    await webDeleteItem(key);
    return;
  }

  return SecureStore.deleteItemAsync(key);
}
