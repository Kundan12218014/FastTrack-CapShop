import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag,
  BarChart2, LogOut, Sun, Moon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../constants/routes";
import { applyTheme, initTheme, type AppTheme } from "../utils/theme";
import { ChatWidget } from "../features/chat";

const navItems = [
  { to: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.ADMIN.PRODUCTS,  icon: Package,          label: "Products"  },
  { to: ROUTES.ADMIN.ORDERS,    icon: ShoppingBag,      label: "Orders"    },
  { to: ROUTES.ADMIN.REPORTS,   icon: BarChart2,        label: "Reports"   },
];

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  const handleLogout = () => { clearAuth(); navigate(ROUTES.LOGIN); };
  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="min-h-screen flex bg-[color:var(--bg)]">

      {/* Sidebar */}
      <aside className="w-64 bg-[linear-gradient(180deg,#1c5b35_0%,#1a4d32_100%)] text-white flex flex-col shadow-xl shadow-black/10">
        {/* Logo */}
        <div className="p-5 border-b border-white/15">
          <h1 className="font-display text-xl font-extrabold tracking-tight">CAPSHOP</h1>
          <p className="text-emerald-100/70 text-xs mt-1">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? "bg-white text-emerald-800 shadow-md shadow-black/10"
                    : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/15">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-300 text-emerald-900 flex items-center justify-center text-xs font-extrabold">
              {user?.fullName?.[0] ?? "A"}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.fullName?.split(" ")[0]}</p>
              <p className="text-xs text-emerald-100/70">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-100/80
                       hover:bg-white/10 hover:text-white rounded-xl transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-transparent">
        <header className="bg-[color:var(--surface)] border-b border-[var(--border-soft)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-base sm:text-lg font-extrabold text-[color:var(--primary-strong)] capitalize">
            {location.pathname.split("/").filter(Boolean).pop() ?? "dashboard"}
          </h2>

          <div className="theme-switch" aria-label="Theme toggle">
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`theme-switch-btn ${theme === "light" ? "active" : ""}`}
              aria-label="Switch to light theme"
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`theme-switch-btn ${theme === "dark" ? "active" : ""}`}
              aria-label="Switch to dark theme"
            >
              <Moon size={14} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      {/* AI chatbot — available for admins too */}
      <ChatWidget />
    </div>
  );
};