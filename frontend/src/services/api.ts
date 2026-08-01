import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Resolves the API base URL from env with validation.
 * - Auto-prepends https:// if missing (avoids "relative path" bug)
 * - Strips trailing slash
 * - Warns loudly in the console if the value is missing or looks wrong
 */
function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();

  if (!raw) {
    console.warn(
      '[api] VITE_API_URL is not set. Falling back to http://localhost:5000/api/v1 — ' +
      'this WILL NOT work in production. Set VITE_API_URL in your deployment env.'
    );
    return 'http://localhost:5000/api/v1';
  }

  let url = raw;

  // Auto-add https:// if user forgot the protocol
  if (!/^https?:\/\//i.test(url)) {
    console.warn(`[api] VITE_API_URL "${url}" is missing protocol — prepending https://`);
    url = `https://${url}`;
  }

  // Strip trailing slash to prevent double slashes
  url = url.replace(/\/+$/, '');

  // Warn if /api prefix looks missing (heuristic)
  if (!/\/api(\/|$)/.test(url)) {
    console.warn(
      `[api] VITE_API_URL "${url}" does not appear to contain "/api" — ` +
      'your requests may 404. Expected format: https://your-backend.com/api/v1'
    );
  }

  return url;
}

const API_URL = resolveApiUrl();
console.info(`[api] Base URL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    // Better error messaging
    let message = 'Something went wrong';
    if (error.code === 'ERR_NETWORK') {
      message = 'Cannot reach the server. Check VITE_API_URL or network connection.';
    } else if (error.response?.status === 405) {
      message = 'API URL misconfigured (405). Check that VITE_API_URL includes https:// and the correct path.';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
      // Append the diagnostic detail when the backend sends one (Prisma errors,
      // unexpected 500s, etc.). Keeps the toast short but useful.
      const detail = error.response.data.detail;
      if (detail && typeof detail === 'string') {
        message = `${message}: ${detail}`;
      }
    }

    if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
