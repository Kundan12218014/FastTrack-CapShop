import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/shared/Navbar";
import { ROUTES } from "../constants/routes";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { Home, Store, ShoppingCart, ReceiptText, User } from "lucide-react";

export const CustomerLayout = () => {
  const location = useLocation();
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen flex flex-col text-[color:var(--text)]" style={{ background: "var(--bg)" }}>
      {/* 
        Navbar now handles the responsive top bar.
        We will pass isActive to Navbar if needed, 
        or it can compute it internally since it has useLocation. 
      */}
      <Navbar />
      
      <main className="flex-1 w-full max-w-screen-xl mx-auto pb-20 md:pb-8 pt-4">
        <Outlet />
      </main>

      {/* Mobile-Only Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[color:var(--border-soft)]"
        style={{ background: "var(--surface)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-around px-2 py-2">

          <Link to={ROUTES.CUSTOMER.HOME}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${isActive(ROUTES.CUSTOMER.HOME) && location.pathname === ROUTES.CUSTOMER.HOME ? "text-[color:var(--primary)]" : "text-[color:var(--text-soft)]"}`}>
            <Home size={22} className={isActive(ROUTES.CUSTOMER.HOME) && location.pathname === ROUTES.CUSTOMER.HOME ? "fill-[var(--primary)]" : ""} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          <Link to={ROUTES.CUSTOMER.PRODUCTS}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${isActive(ROUTES.CUSTOMER.PRODUCTS) ? "text-[color:var(--primary)]" : "text-[color:var(--text-soft)]"}`}>
            <Store size={22} className={isActive(ROUTES.CUSTOMER.PRODUCTS) ? "fill-[var(--primary)]" : ""} />
            <span className="text-[10px] font-bold">Shop</span>
          </Link>

          <Link to={ROUTES.CUSTOMER.CART}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative ${isActive(ROUTES.CUSTOMER.CART) ? "text-[color:var(--primary)]" : "text-[color:var(--text-soft)]"}`}>
            <div className="relative">
              <ShoppingCart size={22} className={isActive(ROUTES.CUSTOMER.CART) ? "fill-[var(--primary)]" : ""} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                  style={{ background: "var(--primary)" }}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
          </Link>

          {isAuthenticated && (
            <Link to={ROUTES.CUSTOMER.ORDERS}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${isActive(ROUTES.CUSTOMER.ORDERS) ? "text-[color:var(--primary)]" : "text-[color:var(--text-soft)]"}`}>
              <ReceiptText size={22} className={isActive(ROUTES.CUSTOMER.ORDERS) ? "stroke-[var(--primary)] fill-transparent" : ""} />
              <span className="text-[10px] font-bold">Orders</span>
            </Link>
          )}

          <Link to={!isAuthenticated ? ROUTES.LOGIN : ROUTES.CUSTOMER.ORDERS}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-[color:var(--text-soft)]">
            <User size={22} />
            <span className="text-[10px] font-bold">{isAuthenticated ? "Account" : "Login"}</span>
          </Link>

        </div>
      </nav>
    </div>
  );
};