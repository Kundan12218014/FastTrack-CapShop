import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import { showToast } from "../../../components/shared/Toast";
import { authApi } from "../../../api/authApi";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
      showToast.success("Reset link sent to your email!");
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[color:var(--surface)] p-8 rounded-3xl border border-[color:var(--border-soft)] shadow-lg relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[color:var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--text-soft)] hover:text-[color:var(--primary)] transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
        </Link>

        {submitted ? (
          <div className="text-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-[color:var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[color:var(--success)] shadow-sm">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-heading font-extrabold text-[color:var(--text)] mb-3">Check your email</h2>
            <p className="text-[15px] text-[color:var(--text-soft)] leading-relaxed mb-8">
              We've sent a 6-digit verification code to <br />
              <strong className="text-[color:var(--text)]">{email}</strong>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full h-12 rounded-xl font-bold text-[15px] bg-[color:var(--primary)] text-white shadow-[0_4px_16px_-6px_var(--primary)] hover:shadow-[0_6px_20px_-6px_var(--primary)] transition-all flex items-center justify-center"
              >
                Enter Code & Reset Password
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                }}
                className="text-sm font-bold text-[color:var(--primary)] hover:underline"
              >
                Didn't receive it? Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-[color:var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6 text-[color:var(--primary)] shadow-sm border border-[color:var(--primary)]/20">
              <Mail size={32} />
            </div>

            <h2 className="text-2xl font-heading font-extrabold text-[color:var(--text)] mb-2">Forgot Password?</h2>
            <p className="text-[15px] font-medium text-[color:var(--text-soft)] mb-8">
              No worries, we'll send you reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-bold text-[color:var(--text)] mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-12 px-4 rounded-xl text-[15px] bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] focus:outline-none focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:var(--primary)]/10 transition-all text-[color:var(--text)] placeholder-[color:var(--text-soft)]/50 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-12 rounded-xl font-bold text-[15px] bg-[color:var(--primary)] text-white shadow-[0_4px_16px_-6px_var(--primary)] hover:shadow-[0_6px_20px_-6px_var(--primary)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Reset Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
