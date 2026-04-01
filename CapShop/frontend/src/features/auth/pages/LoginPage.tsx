import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "react-router-dom";
import { loginSchema, type LoginFormData } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../../../store/authStore";
import { ROUTES } from "../../../constants/routes";

/**
 * LoginPage — Handles:
 *  • React Hook Form with Zod schema validation
 *  • Inline field-level error messages (no page reload)
 *  • Success message from signup redirect
 *  • Disabled submit while loading
 *  • API error displayed below form
 */
export const LoginPage = () => {
  const { handleLogin, loading, error } = useAuth();
  const { isAuthenticated, role }   = useAuthStore();
  const location = useLocation();

  // If already logged in, redirect away (e.g. user navigates back to /login)
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href =
        role === "Admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.HOME;
    }
  }, [isAuthenticated, role]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // Success message passed from Signup page redirect
  const successMessage = (location.state as { successMessage?: string })
    ?.successMessage;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your CapShop account</p>

        {/* Signup success banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* API error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} noValidate className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 transition ${errors.email ? "border-red-400" : "border-gray-300"}`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                focus:ring-blue-500 transition ${errors.password ? "border-red-400" : "border-gray-300"}`}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Signup link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to={ROUTES.SIGNUP} className="text-blue-600 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;