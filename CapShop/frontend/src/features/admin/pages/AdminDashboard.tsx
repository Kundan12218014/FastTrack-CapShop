import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Users, TrendingUp, Clock, Package, AlertTriangle } from "lucide-react";
import { getDashboardSummary, type DashboardSummaryDto } from "../../../api/adminApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";

const KpiCard = ({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="font-display text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getDashboardSummary()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? "Failed to load dashboard data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <p className="text-danger font-medium">{error ?? "Dashboard data unavailable."}</p>
      <button onClick={load} className="btn-primary text-sm py-2 px-4">Retry</button>
    </div>
  );

  const kpis = [
    { label: "Total Orders",    value: data.totalOrders.toLocaleString(),                  icon: ShoppingBag, color: "bg-primary"  },
    { label: "Pending",         value: data.pendingOrders.toLocaleString(),                 icon: Clock,       color: "bg-warning"  },
    { label: "Revenue",         value: `₹${(data.totalRevenue/100000).toFixed(1)}L`,        icon: TrendingUp,  color: "bg-success"  },
    { label: "Customers",       value: data.totalCustomers.toLocaleString(),                icon: Users,       color: "bg-blue-500" },
    { label: "Total Products",  value: data.totalProducts.toLocaleString(),                 icon: Package,     color: "bg-purple-500"},
    { label: "Low Stock",       value: data.lowStockProducts.toLocaleString(),              icon: AlertTriangle, color: "bg-danger" },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Cards (Wf08) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Today's summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 bg-gradient-to-br from-primary to-primary-light text-white">
          <p className="text-sm text-gray-300">Revenue Today</p>
          <p className="font-display text-2xl font-bold">₹{data.revenueToday.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-accent to-accent-dark text-white">
          <p className="text-sm text-orange-100">Orders Today</p>
          <p className="font-display text-2xl font-bold">{data.ordersToday}</p>
        </div>
      </div>

      {/* ── Recent Orders Table (Wf08) ───────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-display font-bold text-primary">Recent Orders</h3>
          <button onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
            className="text-sm text-primary hover:underline font-medium">
            View all
          </button>
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-3">Order#</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-2 text-right">Total</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-2 text-right">Action</span>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet.</div>
        ) : data.recentOrders.map(o => (
          <div key={o.id}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
            <div className="col-span-3 font-bold text-primary text-sm font-mono">{o.orderNumber}</div>
            <div className="col-span-3 text-sm text-gray-600 truncate">{o.customerEmail}</div>
            <div className="col-span-2 text-right font-bold text-gray-800 text-sm">
              ₹{o.totalAmount.toLocaleString("en-IN")}
            </div>
            <div className="col-span-2 flex justify-center">
              <StatusBadge status={o.status} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
                className="text-xs text-primary border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors">
                Update
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};