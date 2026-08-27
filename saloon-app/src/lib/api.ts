import axios from 'axios';

import { API_URL } from './config';
import { REFRESH_KEY, TOKEN_KEY, storage } from './storage';

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Attach the access token to every request.
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A single in-flight refresh shared across concurrent 401s.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = await storage.getItem(REFRESH_KEY);
  if (!rt) return null;
  try {
    // Bare axios (not `api`) so this call skips the interceptors.
    const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken: rt });
    await storage.setItem(TOKEN_KEY, data.data.accessToken);
    await storage.setItem(REFRESH_KEY, data.data.refreshToken);
    return data.data.accessToken as string;
  } catch {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(REFRESH_KEY);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = /\/auth\/(login|register|refresh-token)$/.test(original?.url || '');

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (!refreshing) refreshing = doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Unwrap the backend's { success, message, data } envelope. */
export function unwrap<T = any>(res: { data: { data: T } }): T {
  return res.data.data;
}
