import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag,
  BarChart2, LogOut
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../constants/routes";

const navItems = [
  { to: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.ADMIN.PRODUCTS,  icon: Package,          label: "Products"  },
  { to: ROUTES.ADMIN.ORDERS,    icon: ShoppingBag,      label: "Orders"    },
  { to: ROUTES.ADMIN.REPORTS,   icon: BarChart2,        label: "Reports"   },
];

interface Props {
  onLogout: () => void;
}

export const AdminSidebar = ({ onLogout }: Props) => {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-display text-xl font-bold">CAPSHOP</h1>
        <p className="text-gray-400 text-xs mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300
                     hover:bg-white/10 hover:text-white rounded-xl transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};