import axios from "axios";
import { Platform } from "react-native";
import { deleteItem, getItem, setItem } from "@/src/lib/storage";

const LOCAL_API_HOST = Platform.select({
  android: "http://10.0.2.2:8000",
  ios: "http://localhost:8000",
  web: "http://localhost:8000",
  default: "http://localhost:8000",
});

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? `${LOCAL_API_HOST}/api/v1`;

export const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use(async (config) => {
  const token = await getItem("access_token");
  const tenantSlug = await getItem("tenant_slug");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refresh,
          });
          const { access_token, refresh_token } = res.data.data;
          await setItem("access_token", access_token);
          await setItem("refresh_token", refresh_token);
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return axios(error.config);
        } catch {
          await deleteItem("access_token");
          await deleteItem("refresh_token");
          await deleteItem("tenant_slug");
        }
      }
    }
    return Promise.reject(error);
  }
);
