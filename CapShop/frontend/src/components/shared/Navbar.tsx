import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ROUTES } from "../../constants/routes";
import { useEffect, useState } from "react";
import { applyTheme, initTheme, type AppTheme } from "../../utils/theme";
import { useCartStore } from "../../store/cartStore";
import { ProfileDropdown } from "./ProfileDropdown";
import { LocationSelector } from "./LocationSelector";
import { NotificationBell } from "./NotificationBell";

export const Navbar = () => {
  const { isAuthenticated, role } = useAuthStore();
  const location  = useLocation();
  const { itemCount, cart, fetchCart } = useCartStore();
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === "Customer") {
      fetchCart();
    }
  }, [isAuthenticated, role, location.pathname]);

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const isAdmin = role === "Admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[color:var(--surface)]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 flex items-center justify-between h-14 gap-3">

        {/* Logo */}
        <Link
          to={isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.HOME}
          className="flex items-center gap-2 group flex-shrink-0"
        >
          <img src="/logo.png" alt="CapShop Logo" className="h-9 w-auto object-contain drop-shadow-sm" />
          {isAdmin && <span className="text-[color:var(--accent)] text-xs sm:text-sm font-extrabold ml-1">| Admin</span>}
        </Link>

        {/* Customer nav links & Location */}
        {!isAdmin && (
          <div className="flex items-center gap-4 text-sm font-semibold text-[color:var(--text-soft)]">
            <LocationSelector />
            <div className="hidden lg:flex items-center gap-5 ml-4">
              <Link to={ROUTES.CUSTOMER.HOME}     className="hover:text-[color:var(--primary)] transition-colors">Home</Link>
              <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hover:text-[color:var(--primary)] transition-colors">Shop</Link>
              <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hover:text-[color:var(--primary)] text-orange-500 font-bold transition-colors flex items-center gap-1">Deals</Link>
            </div>
          </div>
        )}

        {/* Admin nav links */}
        {isAdmin && (
          <div className="hidden lg:flex items-center gap-5 text-sm font-semibold text-[color:var(--text-soft)]">
            <Link to={ROUTES.ADMIN.DASHBOARD} className="hover:text-[color:var(--primary)] transition-colors">Dashboard</Link>
            <Link to={ROUTES.ADMIN.PRODUCTS}  className="hover:text-[color:var(--primary)] transition-colors">Products</Link>
            <Link to={ROUTES.ADMIN.ORDERS}    className="hover:text-[color:var(--primary)] transition-colors">Orders</Link>
            <Link to={ROUTES.ADMIN.REPORTS}   className="hover:text-[color:var(--primary)] transition-colors">Reports</Link>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
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

          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <Link to={ROUTES.CUSTOMER.CART} className="ml-2 group active:scale-95 transition-transform flex items-center justify-center">
                  {itemCount > 0 ? (
                    <div className="bg-[#1f9347] hover:bg-[#187538] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm shrink-0 min-w-[90px]">
                      <ShoppingCart size={18} />
                      <div className="flex flex-col items-start leading-[1.1]">
                        <span className="text-[11px] font-bold opacity-90">{itemCount} items</span>
                        <span className="text-[13px] font-extrabold tracking-tight">₹{cart?.total?.toLocaleString("en-IN") || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shrink-0">
                      <ShoppingCart size={18} /> My Cart
                    </div>
                  )}
                </Link>
              )}
              
              {!isAdmin && (
                <div className="ml-1 sm:ml-3">
                  <NotificationBell />
                </div>
              )}
              <div className="ml-2">
                <ProfileDropdown />
              </div>
            </>
          ) : (
            <Link to={ROUTES.LOGIN}
              className="btn-primary px-4 py-1.5 rounded-xl text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};