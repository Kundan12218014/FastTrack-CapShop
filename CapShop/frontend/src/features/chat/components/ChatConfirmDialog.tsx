import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useChat } from "../hooks/useChat";

interface Props {
  orderId: string;
  title: string;
  message: string;
}

/**
 * Inline confirm/cancel dialog rendered inside a chat bubble.
 * Used for destructive actions like order cancellation.
 */
export const ChatConfirmDialog = ({ orderId, title, message }: Props) => {
  const { confirmCancelOrder } = useChat();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await confirmCancelOrder(orderId);
    setConfirmed(true);
    setLoading(false);
  };

  const handleReject = () => {
    setConfirmed(false);
  };

  if (confirmed === true) {
    return (
      <p className="text-sm text-emerald-700 font-semibold">
        ✅ Order cancellation confirmed.
      </p>
    );
  }

  if (confirmed === false) {
    return (
      <p className="text-sm text-[color:var(--text-soft)]">
        Cancellation dismissed. Your order is still active.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[color:var(--text)]">{title}</p>
          <p className="text-xs text-[color:var(--text-soft)] mt-0.5">{message}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling…" : "Yes, Cancel Order"}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 py-2 border border-[color:var(--border-soft)] text-[color:var(--text)] text-xs font-bold rounded-xl hover:bg-[color:var(--surface-alt,#f1f5f9)] transition-colors"
        >
          Keep Order
        </button>
      </div>
    </div>
  );
};
