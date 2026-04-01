import { BarChart3 } from "lucide-react";
import type { DailySalesDto } from "../../../types/admin.types";

interface Props {
  data: DailySalesDto[];
}

export const SalesChart = ({ data }: Props) => {
  if (!data.length) {
    return (
      <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400 text-sm">
        <BarChart3 size={32} className="mx-auto mb-2 text-gray-300" />
        No sales data available for this period
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const recent     = data.slice(-14); // show last 14 days

  return (
    <div className="space-y-2">
      {recent.map(d => (
        <div key={d.date} className="flex items-center gap-3 text-xs">
          <span className="text-gray-500 w-20 flex-shrink-0">
            {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700
                         flex items-center justify-end pr-2"
              style={{ width: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
            >
              {d.revenue > 0 && (
                <span className="text-white text-[9px] font-bold whitespace-nowrap">
                  ₹{(d.revenue / 1000).toFixed(0)}k
                </span>
              )}
            </div>
          </div>
          <span className="text-gray-400 w-12 text-right font-medium">{d.orders} ord</span>
        </div>
      ))}
    </div>
  );
};