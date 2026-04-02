import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Smartphone, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "../../../store/authStore";
import { authApi } from "../../../api/authApi";
import { showToast } from "../../../components/shared/Toast";

export const SecurityPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Email" | "Authenticator">("Authenticator");
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);

  const toggle2FA = async () => {
    setLoading(true);
    try {
      if (is2FAEnabled) {
        await authApi.disableTwoFactor();
        setIs2FAEnabled(false);
        setSecretKey(null);
        setQrUri(null);
        showToast.success("Two-Factor Authentication disabled.");
      } else {
        const response = await authApi.enableTwoFactor({ method: selectedMethod });
        setIs2FAEnabled(true);
        if (response.authenticatorKey) {
          setSecretKey(response.authenticatorKey);
        }
        if (response.qrCodeUri) {
          setQrUri(response.qrCodeUri);
        }
        showToast.success(`Two-Factor Authentication enabled via ${selectedMethod}!`);
      }
    } catch (err: any) {
      showToast.error("Failed to update 2FA settings.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-[color:var(--text)] mb-2 flex items-center gap-3">
          <Shield className="text-[color:var(--primary)]" size={32} /> Security Settings
        </h1>
        <p className="text-[color:var(--text-soft)] text-[15px] font-medium">
          Manage your account security and two-factor authentication.
        </p>
      </div>

      <div className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-[color:var(--text)] mb-1">
              Two-Factor Authentication (2FA)
            </h2>
            <p className="text-[color:var(--text-soft)] text-sm mb-4 max-w-xl leading-relaxed">
              Add an extra layer of security to your account. When enabled, you'll be required to provide a 6-digit code in addition to your password when signing in.
            </p>
          </div>
          <div className="bg-[color:var(--bg-elevated)] p-3 rounded-full shadow-inner">
            {is2FAEnabled ? (
              <ShieldCheck className="text-[color:var(--success)]" size={40} />
            ) : (
              <ShieldAlert className="text-[color:var(--warning)]" size={40} />
            )}
          </div>
        </div>

        {!is2FAEnabled && (
          <div className="mt-4 mb-6">
             <p className="font-bold text-sm text-[color:var(--text)] mb-3">Choose Verification Method:</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedMethod === 'Authenticator' ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                   <input type="radio" name="mfaMethod" className="hidden" checked={selectedMethod === 'Authenticator'} onChange={() => setSelectedMethod('Authenticator')} />
                   <div className={`p-2 rounded-full ${selectedMethod === 'Authenticator' ? 'bg-[color:var(--primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                     <Smartphone size={20} />
                   </div>
                   <div>
                     <p className="font-bold text-[color:var(--text)] text-sm">Authenticator App</p>
                     <p className="text-xs text-gray-500 font-medium">Google, Authy, Microsoft</p>
                   </div>
                </label>
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedMethod === 'Email' ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                   <input type="radio" name="mfaMethod" className="hidden" checked={selectedMethod === 'Email'} onChange={() => setSelectedMethod('Email')} />
                   <div className={`p-2 rounded-full ${selectedMethod === 'Email' ? 'bg-[color:var(--primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                     <Mail size={20} />
                   </div>
                   <div>
                     <p className="font-bold text-[color:var(--text)] text-sm">Email Address</p>
                     <p className="text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">{user?.email}</p>
                   </div>
                </label>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-[color:var(--bg-elevated)] rounded-2xl border border-[color:var(--border-soft)] mt-4">
          <div>
            <p className="font-bold text-[color:var(--text)]">Status</p>
            <p className={`text-sm font-semibold mt-0.5 ${is2FAEnabled ? "text-[color:var(--success)]" : "text-[color:var(--text-soft)]"}`}>
              {is2FAEnabled ? `Enabled (${selectedMethod})` : "Disabled"}
            </p>
          </div>
          <button
            onClick={toggle2FA}
            disabled={loading}
            className={`h-10 px-6 rounded-xl font-bold flex items-center justify-center min-w-[120px] transition-all ${
              is2FAEnabled
                ? "bg-[color:var(--danger)]/10 text-[color:var(--danger)] hover:bg-[color:var(--danger)]/20"
                : "bg-[color:var(--primary)] text-white hover:shadow-[0_4px_16px_-6px_var(--primary)]"
            }`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (is2FAEnabled ? "Disable" : "Enable 2FA")}
          </button>
        </div>

        {is2FAEnabled && selectedMethod === 'Authenticator' && qrUri && secretKey && (
          <div className="mt-6 p-6 bg-[color:var(--primary)]/5 border border-[color:var(--primary)]/20 rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <QRCodeSVG value={qrUri} size={180} level={"H"} />
            </div>
            <div>
              <h3 className="font-bold text-[color:var(--text)] mb-2 text-lg">Authenticator Setup</h3>
              <p className="text-sm text-[color:var(--text-soft)] mb-4 max-w-sm">
                Scan the QR code using an authenticator app (like Google Authenticator or Authy) on your phone.
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Manual Entry Key</p>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-xl py-3 px-4 text-center inline-block">
                <span className="font-mono text-xl tracking-[0.2em] font-bold text-[color:var(--primary)]">{secretKey}</span>
              </div>
            </div>
          </div>
        )}
        
        {is2FAEnabled && selectedMethod === 'Email' && (
           <div className="mt-6 p-6 bg-[color:var(--success)]/10 border border-[color:var(--success)]/20 rounded-2xl animate-in zoom-in-95 duration-300">
              <h3 className="font-bold text-[color:var(--success)] mb-2 text-lg flex items-center gap-2"><Mail size={20}/> Email Verification Active</h3>
              <p className="text-sm text-[color:var(--text-soft)]">
                Every time you sign in, a secure 6-digit OTP code will be sent to <strong>{user?.email}</strong>.
              </p>
           </div>
        )}
      </div>

      <div className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-heading font-extrabold text-[color:var(--text)] mb-4">Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-[color:var(--text-soft)] uppercase tracking-wider">Email Address</p>
            <p className="font-medium text-[color:var(--text)]">{user?.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-[color:var(--text-soft)] uppercase tracking-wider">Account Created</p>
            <p className="font-medium text-[color:var(--text)]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
