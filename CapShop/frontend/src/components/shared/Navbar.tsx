import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, LogOut, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ROUTES } from "../../constants/routes";
import { useEffect, useState } from "react";
import { getCart } from "../../api/orderApi";
import { applyTheme, initTheme, type AppTheme } from "../../utils/theme";

export const Navbar = () => {
  const { isAuthenticated, role, user, clearAuth } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === "Customer") {
      getCart().then(c => setCartCount(c.itemCount)).catch(() => {});
    }
  }, [isAuthenticated, role, location.pathname]);

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  const isAdmin = role === "Admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[color:var(--surface)]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 flex items-center justify-between h-14 gap-3">

        {/* Logo */}
        <Link
          to={isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.HOME}
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[color:var(--primary-strong)]"
        >
          CAPSHOP {isAdmin && <span className="text-[color:var(--accent)] text-xs sm:text-sm ml-1">| Admin</span>}
        </Link>

        {/* Customer nav links */}
        {!isAdmin && (
          <div className="hidden lg:flex items-center gap-5 text-sm font-semibold text-[color:var(--text-soft)]">
            <Link to={ROUTES.CUSTOMER.HOME}     className="hover:text-[color:var(--primary)] transition-colors">Home</Link>
            <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hover:text-[color:var(--primary)] transition-colors">Shop</Link>
            <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hover:text-[color:var(--primary)] transition-colors">Deals</Link>
            <Link to={ROUTES.CUSTOMER.ORDERS}   className="hover:text-[color:var(--primary)] transition-colors">Orders</Link>
            <span className="hover:text-[color:var(--primary)] transition-colors cursor-pointer">Support</span>
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
                <Link to={ROUTES.CUSTOMER.CART} className="relative p-2 rounded-xl hover:bg-[color:var(--surface-muted)] text-[color:var(--text-soft)] hover:text-[color:var(--primary)] transition-colors">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[color:var(--accent)] text-slate-900 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-extrabold">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2 text-sm text-[color:var(--text-soft)]">
                <User size={16} />
                <span className="font-semibold">{user?.fullName?.split(" ")[0]}</span>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1 text-sm rounded-xl px-2 py-1.5 text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--primary)] transition-colors">
                <LogOut size={16} />
                <span className="hidden md:inline font-semibold">Logout</span>
              </button>
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