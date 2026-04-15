import { useEffect, useState } from "react";
import { Download, BarChart3, PieChart } from "lucide-react";
import { getSalesReport, getStatusSplit, downloadSalesCsv, downloadSalesPdf } from "../../../api/adminApi";
import { Loader } from "../../../components/shared/Loader";
import toast from "react-hot-toast";

export const AdminReportsPage = () => {
  const today  = new Date().toISOString().split("T")[0];
  const month  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [from,        setFrom]        = useState(month);
  const [to,          setTo]          = useState(today);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [statusSplit, setStatusSplit] = useState<any>(null);
  const [loading,     setLoading]     = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sales, split] = await Promise.all([getSalesReport(from, to), getStatusSplit()]);
      setSalesReport(sales);
      setStatusSplit(split);
    } catch { toast.error("Could not load reports."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const exportCsv = async () => {
    try {
      await downloadSalesCsv(from, to);
    } catch { toast.error("Failed to download CSV"); }
  };
  const exportPdf = async () => {
    try {
      await downloadSalesPdf(from, to);
    } catch { toast.error("Failed to download PDF"); }
  };

  const maxRevenue = salesReport?.dailyBreakdown?.length
    ? Math.max(...salesReport.dailyBreakdown.map((d: any) => d.revenue))
    : 1;

  return (
    <div className="space-y-5">

      {/* ── Filters (Wf10) ───────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-bold text-primary text-sm">Filters</h3>
          <p className="text-xs text-gray-500">Status • Date range • Payment • Export</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="input-field text-sm py-2" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="input-field text-sm py-2" />
          </div>
          <button onClick={fetchReports} className="btn-primary text-sm py-2">Apply</button>
          <button onClick={exportCsv}
            className="flex items-center gap-1 btn-secondary text-sm py-2">
            <Download size={14} /> CSV
          </button>
          <button onClick={exportPdf}
            className="flex items-center gap-1 btn-secondary text-sm py-2">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      {salesReport && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Revenue</p>
            <p className="font-display text-2xl font-bold text-primary">
              ₹{salesReport.totalRevenue?.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Orders</p>
            <p className="font-display text-2xl font-bold text-primary">{salesReport.totalOrders}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Avg Order Value</p>
            <p className="font-display text-2xl font-bold text-primary">
              ₹{salesReport.averageOrderValue?.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      {loading && <Loader />}

      {/* ── Charts (Wf10) ────────────────────────────────────────── */}
      {!loading && (
        <div className="grid md:grid-cols-2 gap-5">

          {/* Chart: Sales */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-primary" />
              <h3 className="font-bold text-primary">Chart: Sales</h3>
            </div>
            {salesReport?.dailyBreakdown?.length > 0 ? (
              <div className="space-y-2">
                {salesReport.dailyBreakdown.slice(-14).map((d: any) => (
                  <div key={d.date} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500 w-20 flex-shrink-0">
                      {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                      >
                        {d.revenue > 0 && (
                          <span className="text-white text-[9px] font-bold">
                            ₹{(d.revenue / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 w-10 text-right">{d.orders}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400 text-sm">
                <BarChart3 size={32} className="mx-auto mb-2 text-gray-300" />
                Chart placeholder — place orders to see data
              </div>
            )}
          </div>

          {/* Chart: Status Split */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-primary" />
              <h3 className="font-bold text-primary">Chart: Status Split</h3>
            </div>
            {statusSplit?.statusBreakdown?.length > 0 ? (
              <div className="space-y-3">
                {statusSplit.statusBreakdown.map((s: any) => (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{s.status}</span>
                      <span className="text-gray-500">{s.count} ({s.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${s.percentage}%`,
                          background: {
                            Paid:      "#3B82F6",
                            Packed:    "#8B5CF6",
                            Shipped:   "#F97316",
                            Delivered: "#16A34A",
                            Cancelled: "#DC2626",
                          }[s.status as string] ?? "#94A3B8",
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">
                  Total: {statusSplit.totalOrders} orders
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400 text-sm">
                <PieChart size={32} className="mx-auto mb-2 text-gray-300" />
                Chart placeholder — no order data yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};