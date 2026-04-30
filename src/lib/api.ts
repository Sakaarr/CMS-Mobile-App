import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://10.0.2.2:8000/api/v1";
// 10.0.2.2 is the Android emulator's alias for localhost on your machine

export const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
  const tenantSlug = await SecureStore.getItemAsync("tenant_slug");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await SecureStore.getItemAsync("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refresh,
          });
          const { access_token, refresh_token } = res.data.data;
          await SecureStore.setItemAsync("access_token", access_token);
          await SecureStore.setItemAsync("refresh_token", refresh_token);
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return axios(error.config);
        } catch {
          await SecureStore.deleteItemAsync("access_token");
          await SecureStore.deleteItemAsync("refresh_token");
          await SecureStore.deleteItemAsync("tenant_slug");
        }
      }
    }
    return Promise.reject(error);
  }
);