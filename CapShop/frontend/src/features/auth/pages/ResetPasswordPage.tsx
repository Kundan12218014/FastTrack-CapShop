import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import { showToast } from "../../../components/shared/Toast";

import { authApi } from "../../../api/authApi";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  const navigate = useNavigate();

  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!emailParam) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Flow</h2>
          <p className="text-gray-500 mb-6">We could not determine your email address.</p>
          <Link to={ROUTES.LOGIN} className="w-full h-12 rounded-xl font-bold text-[15px] bg-[color:var(--primary)] text-white px-6 py-3">Back to Login</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword || !otpCode) return;

    if (password !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email: emailParam, code: otpCode, newPassword: password });
      showToast.success("Password reset successfully! Please login with your new password.");
      navigate(ROUTES.LOGIN);
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to reset password. Check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[color:var(--surface)] p-8 rounded-3xl border border-[color:var(--border-soft)] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[color:var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-[color:var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 text-[color:var(--primary)] shadow-sm border border-[color:var(--primary)]/20">
            <KeyRound size={32} />
          </div>

          <h2 className="text-2xl font-heading font-extrabold text-[color:var(--text)] mb-2">Reset Password</h2>
          <p className="text-[15px] font-medium text-[color:var(--text-soft)] mb-8">
            Enter the 6-digit code sent to <b>{emailParam}</b> along with your new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* OTP Code */}
            <div>
              <label className="block text-sm font-bold text-[color:var(--text)] mb-2">6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] h-12 px-4 rounded-xl text-[15px] bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] focus:outline-none focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:var(--primary)]/10 transition-all text-[color:var(--text)] placeholder-[color:var(--text-soft)]/50 font-extrabold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[color:var(--text)] mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-12 px-4 rounded-xl text-[15px] bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] focus:outline-none focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:var(--primary)]/10 transition-all text-[color:var(--text)] placeholder-[color:var(--text-soft)]/50 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--text-soft)] hover:text-[color:var(--primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-[color:var(--text)] mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full h-12 px-4 rounded-xl text-[15px] bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] focus:outline-none focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:var(--primary)]/10 transition-all text-[color:var(--text)] placeholder-[color:var(--text-soft)]/50 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || otpCode.length < 6}
              className="w-full h-12 rounded-xl font-bold text-[15px] bg-[color:var(--primary)] text-white shadow-[0_4px_16px_-6px_var(--primary)] hover:shadow-[0_6px_20px_-6px_var(--primary)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Save Password <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
