import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "../types/auth.types";

/**
 * Zustand auth store with localStorage persistence.
 *
 * persist() middleware automatically saves token/user to localStorage
 * on every state change and rehydrates on page reload.
 *
 * Usage anywhere in the app:
 *   const { token, user, role, isAuthenticated } = useAuthStore();
 *   const { setAuth, clearAuth } = useAuthStore();
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (token, user, role) =>
        set({ token, user, role, isAuthenticated: true }),

      clearAuth: () =>
        set({ token: null, user: null, role: null, isAuthenticated: false }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "capshop-auth", // localStorage key
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Only persist these fields — don't persist functions
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
