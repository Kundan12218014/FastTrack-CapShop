import { Package, CheckCircle2, Circle, Truck, Box, CreditCard, XCircle } from "lucide-react";
import type { OrderSummaryDto } from "../../../api/orderApi";
import { useNavigate } from "react-router-dom";
import { buildRoute, ROUTES } from "../../../constants/routes";
import { useChatStore } from "../store/chatStore";

interface Props {
  orders: OrderSummaryDto[];
}

type OrderStatus =
  | "Draft" | "CheckoutStarted" | "PaymentPending" | "Paid"
  | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "PaymentFailed";

const STATUS_STEPS: OrderStatus[] = [
  "PaymentPending", "Paid", "Packed", "Shipped", "Delivered",
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PaymentPending: <CreditCard size={12} />,
  Paid: <CheckCircle2 size={12} />,
  Packed: <Box size={12} />,
  Shipped: <Truck size={12} />,
  Delivered: <Package size={12} />,
  Cancelled: <XCircle size={12} />,
  PaymentFailed: <XCircle size={12} />,
};

const STATUS_COLORS: Record<string, string> = {
  PaymentPending: "text-amber-600 bg-amber-50 border-amber-200",
  Paid: "text-blue-600 bg-blue-50 border-blue-200",
  Packed: "text-indigo-600 bg-indigo-50 border-indigo-200",
  Shipped: "text-purple-600 bg-purple-50 border-purple-200",
  Delivered: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Cancelled: "text-red-600 bg-red-50 border-red-200",
  PaymentFailed: "text-red-600 bg-red-50 border-red-200",
};

function getStepIndex(status: string): number {
  return STATUS_STEPS.indexOf(status as OrderStatus);
}

/**
 * Renders a compact order list with a mini progress stepper for each order.
 */
export const ChatOrderTimeline = ({ orders }: Props) => {
  const navigate = useNavigate();
  const { closeChat } = useChatStore();

  const handleViewOrder = (orderId: string) => {
    navigate(buildRoute(ROUTES.CUSTOMER.ORDER_DETAIL, { id: orderId }));
    closeChat();
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const currentStep = getStepIndex(order.status);
        const isCancelled = order.status === "Cancelled" || order.status === "PaymentFailed";
        const colorClass = STATUS_COLORS[order.status] ?? "text-gray-600 bg-gray-50 border-gray-200";

        return (
          <div
            key={order.id}
            className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-xl p-3 space-y-2.5 hover:border-[color:var(--primary)]/30 transition-colors cursor-pointer"
            onClick={() => handleViewOrder(order.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-bold text-[color:var(--text)]">
                  {order.orderNumber}
                </p>
                <p className="text-[10px] text-[color:var(--text-soft)]">
                  {new Date(order.placedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  {" · "}{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                  {STATUS_ICONS[order.status] ?? <Circle size={10} />}
                  {order.status}
                </span>
              </div>
            </div>

            {/* Amount */}
            <p className="text-[13px] font-extrabold text-[color:var(--text)]">
              ₹{order.totalAmount.toLocaleString("en-IN")}
            </p>

            {/* Progress stepper */}
            {!isCancelled && (
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? active
                              ? "bg-[color:var(--primary)] text-white ring-2 ring-[color:var(--primary)]/30"
                              : "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <Circle size={10} />
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-0.5 transition-colors ${
                            i < currentStep ? "bg-emerald-400" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-[color:var(--primary)] font-semibold">
              Tap to view details →
            </p>
          </div>
        );
      })}
    </div>
  );
};
