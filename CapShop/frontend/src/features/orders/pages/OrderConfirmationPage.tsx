import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { getOrderById, type OrderDto } from "../../../api/orderApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";

export const OrderConfirmationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrderById(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><Loader /></div>;
  if (!order)  return null;

  const eta = new Date(order.placedAt);
  eta.setDate(eta.getDate() + 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Order Confirmed (Wf07) ────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={32} className="text-success" />
          <div>
            <h1 className="font-display text-xl font-bold text-success">Order Confirmed ✓</h1>
            <p className="text-gray-500 text-sm">Thank you for shopping with CapShop!</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Order ID</p>
            <p className="font-bold text-primary font-mono">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Delivery ETA</p>
            <p className="font-bold text-gray-800">{eta.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Status</p>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Items summary */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Items ordered</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm">
              <span className="text-gray-700">{item.productName} × {item.quantity}</span>
              <span className="font-medium text-primary">₹{item.lineTotal.toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold text-primary">
            <span>Total</span>
            <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate(ROUTES.CUSTOMER.ORDERS)} className="btn-primary">
            View My Orders
          </button>
          <button onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)} className="btn-secondary">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};