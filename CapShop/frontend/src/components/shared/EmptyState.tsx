import { ShoppingBag } from "lucide-react";

interface Props {
  title?:       string;
  description?: string;
  actionLabel?: string;
  onAction?:    () => void;
  icon?:        React.ReactNode;
}

export const EmptyState = ({
  title       = "Nothing here yet",
  description = "No items to display.",
  actionLabel,
  onAction,
  icon,
}: Props) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
    <div className="text-gray-300">
      {icon ?? <ShoppingBag size={48} />}
    </div>
    <h3 className="font-display text-lg font-bold text-gray-400">{title}</h3>
    <p className="text-gray-400 text-sm max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn-primary mt-2">
        {actionLabel}
      </button>
    )}
  </div>
);