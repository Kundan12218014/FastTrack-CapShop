import { AlertTriangle } from "lucide-react";

interface Props {
  isOpen:    boolean;
  title:     string;
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
  confirmLabel?: string;
  danger?:       boolean;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  danger = false,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${danger ? "bg-red-100" : "bg-yellow-100"}`}>
            <AlertTriangle size={20} className={danger ? "text-danger" : "text-warning"} />
          </div>
          <h3 className="font-display font-bold text-gray-800">{title}</h3>
        </div>

        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={danger
              ? "bg-danger text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-all active:scale-95"
              : "btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};