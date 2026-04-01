import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * CustomerGuard — protects all /customer/* routes.
 *
 * Checks:
 *   1. Is user authenticated (valid token in store)?
 *   2. Does the token carry the Customer role?
 *
 * If either check fails → redirect to /auth/login.
 * If both pass → render the child route via <Outlet />.
 *
 * Usage in AppRouter.tsx:
 *   <Route element={<CustomerGuard />}>
 *     <Route path="/customer/home" element={<HomePage />} />
 *     ...
 *   </Route>
 *
 * IMPORTANT: This is a UI-level guard only.
 * The backend [Authorize] attribute + JWT validation is the real security.
 * The guard prevents unnecessary API calls and gives a better UX.
 */
export const CustomerGuard = () => {
  const location = useLocation();
  const { isAuthenticated, role, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated || !role) {
    // Not logged in — send to login, preserving intended destination
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (role !== "Customer") {
    // Logged in but wrong role (e.g. Admin trying /customer/* via URL)
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};