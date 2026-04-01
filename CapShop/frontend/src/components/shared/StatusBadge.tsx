interface Props { status: string; }

const statusMap: Record<string, string> = {
  InStock:       "badge-instock",
  LowStock:      "badge-lowstock",
  OutOfStock:    "badge-outstock",
  Paid:          "badge-paid",
  Packed:        "badge-packed",
  Shipped:       "badge-shipped",
  Delivered:     "badge-delivered",
  Cancelled:     "badge-cancelled",
  PaymentFailed: "bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium",
  Draft:         "bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium",
};

export const StatusBadge = ({ status }: Props) => (
  <span className={statusMap[status] ?? "badge-instock"}>{status}</span>
);