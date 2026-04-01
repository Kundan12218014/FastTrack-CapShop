import axios, { type AxiosInstance, type AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

/**
 * Central Axios instance.
 * ALL API calls go through this — never create a raw axios instance elsewhere.
 *
 * Responsibilities:
 *   1. Set baseURL to the Ocelot gateway
 *   2. REQUEST interceptor: attach JWT Bearer header automatically
 *   3. RESPONSE interceptor: handle 401 (expired token) and 403 (forbidden) globally
 *
 * In development we intentionally use relative /gateway so Vite proxy forwards
 * to Ocelot and avoids local CORS/certificate problems.
 * In production we use VITE_GATEWAY_URL.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV
    ? "/gateway"
    : ((import.meta.env.VITE_GATEWAY_URL as string) ??
      "https://localhost:5000/gateway"),
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 seconds
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Runs before every outgoing request.
// Reads the current token from Zustand store and attaches it as Bearer header.
apiClient.interceptors.request.use(
  (config) => {
    // getState() is the non-hook way to read Zustand outside React components
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
// Runs after every response (including errors).
// Centralises auth-error handling so individual API functions don't repeat it.
apiClient.interceptors.response.use(
  // Success: pass response through unchanged
  (response) => response,

  // Error: inspect status code and handle auth errors globally
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/verify-two-factor");

    if (error.response?.status === 401) {
      // Let login/signup/2FA screens handle invalid credentials themselves.
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Token expired or invalid — wipe auth state and redirect to login
      useAuthStore.getState().clearAuth();
      // Use window.location to avoid circular React Router dependency
      window.location.href = "/auth/login";
    }

    if (error.response?.status === 403) {
      // Authenticated but wrong role — redirect to home, not login
      console.warn("Access denied: insufficient permissions.");
      window.location.href = "/customer/home";
    }

    // Re-throw so individual API callers can still catch and handle errors
    return Promise.reject(error);
  },
);

export default apiClient;
