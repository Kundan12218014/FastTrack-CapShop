import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { signupSchema, loginSchema, type SignupFormValues, type LoginFormValues } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import { LogIn, UserPlus } from "lucide-react";
import { ROUTES } from "../../../constants/routes";

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginRoute = location.pathname === ROUTES.LOGIN;
  
  const [tab, setTab] = useState<"login" | "signup">(isLoginRoute ? "login" : "signup");
  const { handleLogin, handleSignup, loading, error } = useAuth();

  const toggleTab = (newTab: "login" | "signup") => {
    setTab(newTab);
    navigate(newTab === "login" ? ROUTES.LOGIN : ROUTES.REGISTER, { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-extrabold text-[color:var(--text)] mb-2">
              {tab === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-[color:var(--text-soft)] text-sm">
              {tab === "login" ? "Enter your credentials to access your account" : "Join CapShop for Zepto-Speed delivery"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-[color:var(--surface-muted)] rounded-xl mb-6">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "login" ? "bg-[color:var(--surface)] text-[color:var(--primary)] shadow-sm" : "text-[color:var(--text-soft)] hover:text-[color:var(--text)]"}`}
              onClick={() => toggleTab("login")}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "signup" ? "bg-[color:var(--surface)] text-[color:var(--primary)] shadow-sm" : "text-[color:var(--text-soft)] hover:text-[color:var(--text)]"}`}
              onClick={() => toggleTab("signup")}
            >
              <UserPlus size={16} /> Signup
            </button>
          </div>

          {/* Panels */}
          {tab === "signup" ? (
            <SignupPanel onSubmit={handleSignup} loading={loading} error={error} />
          ) : (
            <LoginPanel onSubmit={handleLogin} loading={loading} error={error} />
          )}

        </div>
      </div>
    </div>
  );
};

// ── Signup Panel ────────────────────────────────────────────────────────────
const SignupPanel = ({ onSubmit, loading, error }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {error && (
        <div className="mb-4 p-3 bg-[color:var(--danger)]/10 border border-[color:var(--danger)]/20 rounded-xl text-[color:var(--danger)] text-sm font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <input {...register("fullName")} placeholder="Full Name"
            className={`input-field h-11 ${errors.fullName ? "input-error" : ""}`} />
          {errors.fullName && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <input {...register("email")} type="email" placeholder="Email Address"
            className={`input-field h-11 ${errors.email ? "input-error" : ""}`} />
          {errors.email && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("phoneNumber")} type="tel" placeholder="Phone Number"
            className={`input-field h-11 ${errors.phoneNumber ? "input-error" : ""}`} maxLength={10} />
          {errors.phoneNumber && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.phoneNumber.message}</p>}
        </div>
        <div>
          <input {...register("password")} type="password" placeholder="Password"
            className={`input-field h-11 ${errors.password ? "input-error" : ""}`} />
          {errors.password && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.password.message}</p>}
        </div>
        
        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-[15px]">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Login Panel ─────────────────────────────────────────────────────────────
const LoginPanel = ({ onSubmit, loading, error }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {error && (
        <div className="mb-4 p-3 bg-[color:var(--danger)]/10 border border-[color:var(--danger)]/20 rounded-xl text-[color:var(--danger)] text-sm font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <input {...register("email")} type="email" placeholder="Email Address"
            className={`input-field h-11 ${errors.email ? "input-error" : ""}`} />
          {errors.email && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.email.message}</p>}
        </div>
        <div>
          <input {...register("password")} type="password" placeholder="Password"
            className={`input-field h-11 ${errors.password ? "input-error" : ""}`} />
          {errors.password && <p className="text-xs text-[color:var(--danger)] mt-1.5 ml-1">{errors.password.message}</p>}
        </div>
        
        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-[15px]">
            {loading ? "Signing in…" : "Login"}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm text-[color:var(--text-soft)]">
        Customer or Admin credentials are supported.
      </div>
    </div>
  );
};