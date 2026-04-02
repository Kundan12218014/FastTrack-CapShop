import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, type OrderSummaryDto } from "../../../api/orderApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES, buildRoute } from "../../../constants/routes";
import { ReceiptText, ShoppingBag, ChevronRight, PackageOpen } from "lucide-react";

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getMyOrders(page, 10)
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 min-h-[85vh] animate-in fade-in">
      <div className="flex items-center gap-3 mb-8">
         <div className="w-12 h-12 rounded-2xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center">
             <ReceiptText size={24} />
         </div>
         <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[color:var(--text)] leading-tight">
            Order History
            </h1>
            <p className="text-sm font-medium text-[color:var(--text-soft)]">
              View and track all your recent purchases
            </p>
         </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <Loader />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl shadow-sm px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-[color:var(--bg-elevated)] rounded-full flex items-center justify-center border border-[color:var(--border-soft)]">
             <PackageOpen size={48} className="text-[color:var(--text-soft)] opacity-50" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-[color:var(--text)] mb-2">No orders found</h2>
          <p className="text-sm font-medium text-[color:var(--text-soft)] mb-8 max-w-sm mx-auto">
            You haven't placed any orders yet. Start exploring our wide range of products!
          </p>
          <Link
            to={ROUTES.CUSTOMER.PRODUCTS}
            className="btn-primary px-8 h-12 inline-flex items-center gap-2 shadow-md"
          >
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={buildRoute(ROUTES.CUSTOMER.ORDER_CONFIRM, { id: order.id })}
              className="block rounded-2xl p-5 md:p-6 transition-all hover:shadow-md bg-[color:var(--surface)] border border-[color:var(--border-soft)] hover:border-[color:var(--primary)]/30 group relative overflow-hidden"
            >
              {/* Decorative side accent */}
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left side info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <p className="font-bold text-[15px] font-mono text-[color:var(--text)] bg-[color:var(--surface-muted)] px-2 py-0.5 rounded border border-[color:var(--border-soft)]">
                      {order.orderNumber}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <p className="text-sm font-medium text-[color:var(--text-soft)]">
                    Placed on {new Date(order.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-3">
                     <span className="text-xs font-bold px-2 py-1 bg-[color:var(--bg-elevated)] rounded-md text-[color:var(--text-soft)] border border-[color:var(--border-soft)]">
                         {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                     </span>
                  </div>
                </div>

                {/* Right side info */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-4 border-t border-[color:var(--border-soft)] md:border-none pt-4 md:pt-0 mt-2 md:mt-0">
                  <div className="flex flex-col md:items-end">
                      <span className="text-xs uppercase tracking-widest font-bold text-[color:var(--text-soft)] mb-0.5">Total</span>
                      <span className="font-heading font-black text-xl md:text-2xl text-[color:var(--primary-strong)]">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[13px] font-bold text-[color:var(--primary)] group-hover:underline">
                      View Details <ChevronRight size={16} />
                  </div>
                </div>

              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-6 pb-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)] shadow-sm"
              >
                ← Prev
              </button>
              <div className="px-4 py-2 text-sm font-bold text-[color:var(--text)] bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-xl shadow-sm">
                Page {page} of {totalPages}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)] shadow-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
