import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "react-router-dom";
import { signupSchema, loginSchema, type SignupFormValues, type LoginFormValues } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../../../store/authStore";

export const AuthPage = () => {
  const location = useLocation();
  // Central tab state to toggle the internal card view
  const [tab, setTab] = useState<"login" | "signup">(location.pathname?.includes("signup") ? "signup" : "login");
  const { handleLogin, handleSignup, loading, error } = useAuth();
  const { pendingTwoFactorEmail, setPendingTwoFactor } = useAuthStore();
  
  // Two Factor Auth local state
  const { handleVerifyTwoFactor } = useAuth();
  const [otpCode, setOtpCode] = useState("");

  const onLoginSubmit = (data: LoginFormValues) => {
    handleLogin(data);
  };

  const onSignupSubmit = (data: SignupFormValues) => {
    handleSignup(data).then(() => {
      // automatically switch to login form visually
      if (!error) setTab("login");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#f7f6f6] relative">
      <div className="w-full max-w-md bg-white rounded-[12px] shadow-[0_12px_32px_rgba(13,14,15,0.06)] overflow-hidden relative z-10 p-8 pt-10">
        
        {/* Kinetic Header Branding */}
        <div className="flex justify-center mb-8">
           <img src="/logo.png" alt="CapShop Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Dynamic Inner views */}
        {pendingTwoFactorEmail ? (
          // --- OTP View ---
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-extrabold text-[#111] mb-2 text-center">Security Check</h2>
            <p className="text-[#5a5c5c] text-[13px] mb-8 text-center leading-relaxed">
              We've sent a 6-digit verification code to <br/><span className="font-bold text-[#1f6a00]">{pendingTwoFactorEmail}</span>
            </p>

            {error && (
              <div className="mb-6 p-3 bg-[#f95630]/10 border border-[#f95630]/20 rounded-md text-[#b92902] text-[13px] font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyTwoFactor(otpCode); }} className="space-y-6">
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full h-14 bg-transparent border-0 border-b-2 border-[#acadad] focus:ring-0 focus:border-[#1f6a00] text-center text-3xl tracking-[0.5em] font-mono transition-colors text-[#2d2f2f] placeholder-[#acadad]/50 px-2"
              />
              <button 
                type="submit" 
                disabled={loading || otpCode.length < 6} 
                className="w-full h-12 bg-gradient-to-br from-[#1f6a00] to-[#8bfd60] text-[#d4ffbd] hover:text-white font-extrabold rounded-[6px] tracking-wide text-sm transition-all shadow-[0_6px_12px_rgba(31,106,0,0.15)] hover:shadow-[0_8px_16px_rgba(31,106,0,0.25)] active:scale-[0.98] mt-4 disabled:opacity-50"
              >
                {loading ? "VERIFYING…" : "VERIFY CODE"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setPendingTwoFactor(null)}
                className="w-full text-xs font-bold text-[#acadad] hover:text-[#5a5c5c] transition-colors mt-2"
              >
                Cancel and return to login
              </button>
            </form>
          </div>
        ) : (
          // --- Tabbed Form View ---
          <div className="animate-in fade-in duration-300">
            
            {/* Tabs */}
            <div className="flex border-b border-[#e8e8e8] mb-8">
              <button 
                onClick={() => setTab("login")}
                className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-colors border-b-2 ${tab === "login" ? "text-[#1f6a00] border-[#1f6a00]" : "text-[#9c9d9d] border-transparent hover:text-[#5a5c5c]"}`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => setTab("signup")}
                className={`flex-1 pb-3 text-sm font-bold tracking-wide transition-colors border-b-2 ${tab === "signup" ? "text-[#1f6a00] border-[#1f6a00]" : "text-[#9c9d9d] border-transparent hover:text-[#5a5c5c]"}`}
              >
                SIGN UP
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-[#f95630]/10 border border-[#f95630]/20 rounded-md text-[#b92902] text-[13px] font-semibold text-center">
                {error}
              </div>
            )}

            {tab === "login" ? (
              <LoginForm onSubmit={onLoginSubmit} loading={loading} />
            ) : (
              <SignupForm onSubmit={onSignupSubmit} loading={loading} />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

// ── Login Form ─────────────────────────────────────────────────────────────
const LoginForm = ({ onSubmit, loading }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d] mb-1">Email</label>
        <input {...register("email")} type="email" placeholder="john@example.com"
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.email ? "border-[#b92902]" : ""}`} />
        {errors.email && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.email.message}</p>}
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d]">Password</label>
          <Link to="/auth/forgot-password" className="text-[11px] font-extrabold text-[#1f6a00] hover:text-[#8bfd60] transition-colors">
            Forgot?
          </Link>
        </div>
        <input {...register("password")} type="password" placeholder="••••••••"
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.password ? "border-[#b92902]" : ""}`} />
        {errors.password && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.password.message}</p>}
      </div>
      
      <div className="pt-4">
        <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-br from-[#1f6a00] to-[#8bfd60] text-[#d4ffbd] hover:text-white font-extrabold rounded-[6px] tracking-wide text-sm transition-all shadow-[0_6px_12px_rgba(31,106,0,0.15)] hover:shadow-[0_8px_16px_rgba(31,106,0,0.25)] active:scale-[0.98] disabled:opacity-50">
          {loading ? "AUTHENTICATING…" : "LOGIN"}
        </button>
      </div>
    </form>
  );
};

// ── Signup Form ─────────────────────────────────────────────────────────────
const SignupForm = ({ onSubmit, loading }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d] mb-1">Full Name</label>
        <input {...register("fullName")} placeholder="John Doe"
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.fullName ? "border-[#b92902]" : ""}`} />
        {errors.fullName && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.fullName.message}</p>}
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d] mb-1">Email</label>
        <input {...register("email")} type="email" placeholder="john@example.com"
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.email ? "border-[#b92902]" : ""}`} />
        {errors.email && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d] mb-1">Phone Number</label>
        <input {...register("phoneNumber")} type="tel" placeholder="9999999999" maxLength={10}
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.phoneNumber ? "border-[#b92902]" : ""}`} />
        {errors.phoneNumber && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.phoneNumber.message}</p>}
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-widest font-extrabold text-[#9c9d9d] mb-1">Password</label>
        <input {...register("password")} type="password" placeholder="••••••••"
          className={`w-full h-10 bg-transparent border-0 border-b border-[#acadad] focus:ring-0 focus:border-[#1f6a00] transition-colors text-[15px] font-medium text-[#2d2f2f] placeholder-[#acadad]/50 px-1 ${errors.password ? "border-[#b92902]" : ""}`} />
        {errors.password && <p className="text-[11px] text-[#b92902] mt-1.5 font-semibold">{errors.password.message}</p>}
      </div>
      
      <div className="pt-4">
        <button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-br from-[#1f6a00] to-[#8bfd60] text-[#d4ffbd] hover:text-white font-extrabold rounded-[6px] tracking-wide text-sm transition-all shadow-[0_6px_12px_rgba(31,106,0,0.15)] hover:shadow-[0_8px_16px_rgba(31,106,0,0.25)] active:scale-[0.98] disabled:opacity-50">
          {loading ? "CREATING ACCOUNT…" : "SIGN UP"}
        </button>
      </div>
    </form>
  );
};