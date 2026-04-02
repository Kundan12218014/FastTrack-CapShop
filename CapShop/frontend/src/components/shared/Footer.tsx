import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

export const Footer = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center px-4 pb-4 pt-2 bg-[#ffffff] dark:bg-[#1a1c1c] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-[1.5rem] md:w-auto md:left-1/2 md:-translate-x-1/2 md:rounded-3xl md:bottom-4 md:px-6 md:gap-8">
      <Link
        to={ROUTES.CUSTOMER.HOME}
        className={`flex flex-col items-center justify-center px-5 py-2 duration-150 ${
          isActive(ROUTES.CUSTOMER.HOME)
            ? "bg-[color:var(--primary-container)] text-[color:var(--on-primary-fixed)] rounded-xl active:scale-95"
            : "text-secondary hover:bg-[color:var(--surface-container-high)] active:scale-95 rounded-xl"
        }`}
      >
        <span className="material-symbols-outlined" style={isActive(ROUTES.CUSTOMER.HOME) ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
        <span className="font-['Inter'] text-[11px] font-bold">Home</span>
      </Link>

      <Link
        to={ROUTES.CUSTOMER.PRODUCTS}
        className={`flex flex-col items-center justify-center px-5 py-2 duration-150 ${
          location.pathname.startsWith(ROUTES.CUSTOMER.PRODUCTS)
            ? "bg-[color:var(--primary-container)] text-[color:var(--on-primary-fixed)] rounded-xl active:scale-95"
            : "text-secondary hover:bg-[color:var(--surface-container-high)] active:scale-95 rounded-xl"
        }`}
      >
        <span className="material-symbols-outlined" style={location.pathname.startsWith(ROUTES.CUSTOMER.PRODUCTS) ? { fontVariationSettings: "'FILL' 1" } : {}}>grid_view</span>
        <span className="font-['Inter'] text-[11px] font-bold">Categories</span>
      </Link>

      <Link
        to={ROUTES.CUSTOMER.ORDERS}
        className={`flex flex-col items-center justify-center px-5 py-2 duration-150 ${
          isActive(ROUTES.CUSTOMER.ORDERS)
            ? "bg-[color:var(--primary-container)] text-[color:var(--on-primary-fixed)] rounded-xl active:scale-95"
            : "text-secondary hover:bg-[color:var(--surface-container-high)] active:scale-95 rounded-xl"
        }`}
      >
        <span className="material-symbols-outlined" style={isActive(ROUTES.CUSTOMER.ORDERS) ? { fontVariationSettings: "'FILL' 1" } : {}}>receipt_long</span>
        <span className="font-['Inter'] text-[11px] font-bold">Orders</span>
      </Link>

      <Link
        to={"#"}
        className={`flex flex-col items-center justify-center px-5 py-2 duration-150 ${
          false
            ? "bg-[color:var(--primary-container)] text-[color:var(--on-primary-fixed)] rounded-xl active:scale-95"
            : "text-secondary hover:bg-[color:var(--surface-container-high)] active:scale-95 rounded-xl"
        }`}
      >
        <span className="material-symbols-outlined">person</span>
        <span className="font-['Inter'] text-[11px] font-bold">Account</span>
      </Link>
    </nav>
  );
};
