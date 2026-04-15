import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getAdminOrders, updateOrderStatus, type AdminOrderSummaryDto } from "../../../api/adminApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["", "Paid", "Packed", "Shipped", "Delivered", "Cancelled"];
const NEXT_STATUS: Record<string, string[]> = {
  Paid:    ["Packed", "Cancelled"],
  Packed:  ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
};

export const AdminOrdersPage = () => {
  const [orders,   setOrders]   = useState<AdminOrderSummaryDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminOrders(search || undefined, status || undefined, page, 10);
      setOrders(res.items);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load orders.";
      setFetchError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [search, status, page]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order updated to ${newStatus}`);
      fetchOrders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not update status.");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Filters (Wf10) ───────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <h3 className="font-bold text-primary text-sm mr-2">Filters</h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search order# or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9 text-sm py-2 w-64" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input-field w-auto text-sm py-2">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-500">Status • Date range • Payment • Export</span>
      </div>

      {/* ── Orders Queue Table (Wf10) ─────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-2">Order#</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-2 text-center">Payment</span>
          <span className="col-span-1 text-right">Total</span>
          <span className="col-span-2 text-right">Update</span>
        </div>

        {loading ? <div className="p-8"><Loader /></div> :
         fetchError ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-danger text-sm font-medium">{fetchError}</p>
            <button onClick={fetchOrders} className="btn-primary text-xs py-1.5 px-3">Retry</button>
          </div>
         ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders found.</div>
        ) : orders.map(order => (
          <div key={order.id}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">

            <div className="col-span-2">
              <p className="font-bold text-primary text-sm font-mono">{order.orderNumber}</p>
              <p className="text-xs text-gray-400">{new Date(order.placedAt).toLocaleDateString("en-IN")}</p>
            </div>

            <div className="col-span-3 text-sm text-gray-600 truncate">{order.customerEmail}</div>

            <div className="col-span-2 flex justify-center">
              <StatusBadge status={order.status} />
            </div>

            <div className="col-span-2 text-center">
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {order.paymentMethod}
              </span>
            </div>

            <div className="col-span-1 text-right font-bold text-primary text-sm">
              ₹{order.totalAmount.toLocaleString("en-IN")}
            </div>

            <div className="col-span-2 flex justify-end">
              {NEXT_STATUS[order.status] ? (
                <select
                  onChange={e => e.target.value && handleStatusUpdate(order.id, e.target.value)}
                  defaultValue=""
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="" disabled>Update →</option>
                  {NEXT_STATUS[order.status].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-400 italic">Final</span>
              )}
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm">Prev</button>
            <span className="text-sm text-gray-500 py-1">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};