import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../constants/routes";

/**
 * GuestGuard — protects auth routes from being accessed by authenticated users.
 *
 * Checks:
 *   1. Is user authenticated (valid token in store)?
 *
 * If authenticated → redirect to appropriate home based on role.
 * If not authenticated → render the auth child route via <Outlet />.
 */
export const GuestGuard = () => {
  const { isAuthenticated, role, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  if (isAuthenticated && role) {
    // If logged in, send them to their dashboard
    if (role === "Admin") {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.CUSTOMER.HOME} replace />;
  }

  return <Outlet />;
};
