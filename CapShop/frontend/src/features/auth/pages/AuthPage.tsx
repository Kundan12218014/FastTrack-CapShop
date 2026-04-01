import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { signupSchema, loginSchema, type SignupFormValues, type LoginFormValues } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import { applyTheme, initTheme, type AppTheme } from "../../../utils/theme";

export const AuthPage = () => {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/auth/login";
  const [tab, setTab] = useState<"login" | "signup">(isLoginRoute ? "login" : "signup");
  const [theme, setTheme] = useState<AppTheme>(initTheme());
  const { handleLogin, handleSignup, loading, error } = useAuth();

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-4 right-4 theme-switch" aria-label="Theme toggle">
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`theme-switch-btn ${theme === "light" ? "active" : ""}`}
          aria-label="Switch to light theme"
        >
          <Sun size={14} />
        </button>
        <button
          type="button"
          onClick={() => handleThemeChange("dark")}
          className={`theme-switch-btn ${theme === "dark" ? "active" : ""}`}
          aria-label="Switch to dark theme"
        >
          <Moon size={14} />
        </button>
      </div>

      <div className="w-full max-w-4xl">

        {/* Wf02 — Side by side Signup + Login panels */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Signup Panel ──────────────────────────────────────── */}
          <SignupPanel
            active={tab === "signup"}
            onActivate={() => setTab("signup")}
            onSubmit={handleSignup}
            loading={loading && tab === "signup"}
            error={tab === "signup" ? error : null}
          />

          {/* ── Login Panel ───────────────────────────────────────── */}
          <LoginPanel
            active={tab === "login"}
            onActivate={() => setTab("login")}
            onSubmit={handleLogin}
            loading={loading && tab === "login"}
            error={tab === "login" ? error : null}
          />
        </div>
      </div>
    </div>
  );
};

// ── Signup Panel ────────────────────────────────────────────────────────────
const SignupPanel = ({ active, onActivate, onSubmit, loading, error }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  return (
    <div
      className={`card p-6 transition-all duration-200 cursor-pointer
        ${active ? "ring-2 ring-primary shadow-md" : "opacity-75 hover:opacity-90"}`}
      onClick={onActivate}
    >
      <h2 className="font-display text-xl font-extrabold text-[color:var(--primary-strong)] mb-1">Signup</h2>
      <p className="text-[color:var(--text-soft)] text-sm mb-4">Customer registration</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <input {...register("fullName")} placeholder="Full Name"
            className={`input-field ${errors.fullName ? "input-error" : ""}`} />
          {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <input {...register("email")} type="email" placeholder="Email"
            className={`input-field ${errors.email ? "input-error" : ""}`} />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("phoneNumber")} type="tel" placeholder="Phone"
            className={`input-field ${errors.phoneNumber ? "input-error" : ""}`} maxLength={10} />
          {errors.phoneNumber && <p className="text-xs text-danger mt-1">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <input {...register("password")} type="password" placeholder="Password"
            className={`input-field ${errors.password ? "input-error" : ""}`} />
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </div>
  );
};

// ── Login Panel ─────────────────────────────────────────────────────────────
const LoginPanel = ({ active, onActivate, onSubmit, loading, error }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div
      className={`card p-6 transition-all duration-200 cursor-pointer
        ${active ? "ring-2 ring-primary shadow-md" : "opacity-75 hover:opacity-90"}`}
      onClick={onActivate}
    >
      <h2 className="font-display text-xl font-extrabold text-[color:var(--primary-strong)] mb-1">Login</h2>
      <p className="text-[color:var(--text-soft)] text-sm mb-4">Customer / Admin</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <div>
          <input {...register("email")} type="email" placeholder="Email"
            className={`input-field ${errors.email ? "input-error" : ""}`} />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("password")} type="password" placeholder="Password"
            className={`input-field ${errors.password ? "input-error" : ""}`} />
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
};