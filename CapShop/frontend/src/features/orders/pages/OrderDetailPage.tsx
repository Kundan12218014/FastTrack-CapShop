import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useOrderDetail } from "../hooks/useOrders";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import { formatCurrency, formatDateTime, calculateEta } from "../../../utils/formatUtils";
import { ROUTES } from "../../../constants/routes";

export const OrderDetailPage = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, loading } = useOrderDetail(id);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><Loader /></div>;
  if (!order)  return null;

  const eta = calculateEta(order.placedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.CUSTOMER.ORDERS)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to orders
      </button>

      {/* Header */}
      <div className="card p-6 mb-4">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-primary">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">Placed on {formatDateTime(order.placedAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total</p>
            <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment</p>
            <p className="font-medium text-gray-800">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ETA</p>
            <p className="font-medium text-gray-800">
              {eta.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Transaction</p>
            <p className="font-mono text-xs text-gray-600 truncate">{order.transactionId ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-primary text-sm mb-3">Shipping Address</h3>
        <div className="text-sm text-gray-600 space-y-0.5">
          <p className="font-medium text-gray-800">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.addressLine}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
          <p>{order.shippingAddress.phoneNumber}</p>
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-primary text-sm">Items ({order.items.length})</h3>
        </div>
        {order.items.map((item, i) => (
          <div key={i}
            className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 text-sm">
            <div>
              <p className="font-medium text-gray-800">{item.productName}</p>
              <p className="text-xs text-gray-400">
                {formatCurrency(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <span className="font-bold text-primary">{formatCurrency(item.lineTotal)}</span>
          </div>
        ))}
        <div className="flex justify-between px-5 py-3.5 font-bold text-primary">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};