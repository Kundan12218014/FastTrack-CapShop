import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserById, login, signup, authApi } from "../../../api/authApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { ROUTES } from "../../../constants/routes";
import type {
  LoginRequestDto,
  SignupRequestDto,
  UserDto,
} from "../../../types/auth.types";
import { showToast } from "../../../components/shared/Toast";
import { decodeJwtPayload } from "../../../utils/tokenUtils";

const getClaim = (
  payload: Record<string, unknown>,
  key: string,
): string | null => {
  const value = payload[key];
  return typeof value === "string" ? value : null;
};

const getRoleFromPayload = (
  payload: Record<string, unknown>,
): "Customer" | "Admin" | null => {
  const role =
    getClaim(payload, "role") ??
    getClaim(
      payload,
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    );
  return role === "Admin" || role === "Customer" ? role : null;
};

const getUserIdFromPayload = (
  payload: Record<string, unknown>,
): string | null =>
  getClaim(payload, "nameid") ??
  getClaim(payload, "sub") ??
  getClaim(
    payload,
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  );

export const useAuth = () => {
  const { setAuth, clearAuth } = useAuthStore();
  const { reset: resetCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Login ─────────────────────────────────────────────────────────────
  const handleLogin = async (data: LoginRequestDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(data);

      if (result.requiresTwoFactor) {
        useAuthStore.getState().setPendingTwoFactor(data.email);
        showToast.success(`OTP sent to your ${result.twoFactorMethod?.toLowerCase() || 'device'}`);
        return;
      }

      if (!result.token) {
        setError("Login response did not include a token.");
        return;
      }

      const payload = decodeJwtPayload(result.token) ?? {};
      const role =
        result.role ?? result.user?.role ?? getRoleFromPayload(payload);
      const userId = result.user?.id ?? getUserIdFromPayload(payload);

      if (!role) {
        setError("Could not determine user role from login response.");
        return;
      }

      let user: UserDto;
      if (result.user) {
        user = result.user;
      } else if (userId) {
        user = await getUserById(userId);
      } else {
        user = {
          id: "",
          fullName: data.email,
          email: data.email,
          phoneNumber: "",
          role,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      setAuth(result.token, user, role);

      // Redirect to originally attempted URL or role home
      const from = (location.state as { from?: Location })?.from?.pathname;
      if (from && !from.startsWith("/auth")) {
        navigate(from, { replace: true });
      } else if (role === "Admin") {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.CUSTOMER.HOME, { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Signup ────────────────────────────────────────────────────────────
  const handleSignup = async (data: SignupRequestDto) => {
    setLoading(true);
    setError(null);
    try {
      await signup(data);
      showToast.success("Account created! Please sign in.");
      navigate(ROUTES.LOGIN, {
        state: { message: "Account created successfully! Please login." },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearAuth();
    resetCart();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // ── Two Factor Verify ───────────────────────────────────────────────────
  const handleVerifyTwoFactor = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = useAuthStore.getState().pendingTwoFactorEmail;
      if (!email) throw new Error("No pending 2FA session.");

      const result = await authApi.verifyTwoFactor({ email, code });

      if (!result.token) {
        setError("Verification response did not include a token.");
        return;
      }

      const payload = decodeJwtPayload(result.token) ?? {};
      const role = result.role ?? result.user?.role ?? getRoleFromPayload(payload);
      const userId = result.user?.id ?? getUserIdFromPayload(payload);

      if (!role) {
        setError("Could not determine user role from verification response.");
        return;
      }

      let user: UserDto;
      if (result.user) user = result.user;
      else if (userId) user = await getUserById(userId);
      else throw new Error("Could not construct user profile.");

      setAuth(result.token, user, role);
      showToast.success("Verification successful!");

      // Redirect
      const from = (location.state as { from?: Location })?.from?.pathname;
      if (from && !from.startsWith("/auth")) {
        navigate(from, { replace: true });
      } else if (role === "Admin") {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.CUSTOMER.HOME, { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid or expired code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, handleSignup, handleLogout, handleVerifyTwoFactor, loading, error };
};
