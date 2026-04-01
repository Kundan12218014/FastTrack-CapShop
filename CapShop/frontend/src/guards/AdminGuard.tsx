import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * AdminGuard — protects all /admin/* routes.
 *
 * Checks:
 *   1. Is user authenticated?
 *   2. Does the token carry the Admin role?
 *
 * A Customer trying to access /admin/* → redirect to /customer/home.
 * Unauthenticated user → redirect to /auth/login.
 */
export const AdminGuard = () => {
  const location = useLocation();
  const { isAuthenticated, role, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (role !== "Admin") {
    // Customer role — send them to their own area
    return <Navigate to="/customer/home" replace />;
  }

  return <Outlet />;
};