import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown, Package, Shield } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { ROUTES } from "../../constants/routes";

export const ProfileDropdown = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[color:var(--text)] hover:text-[color:var(--primary)] transition-colors px-2 py-1.5 rounded-xl hover:bg-[color:var(--surface-muted)]"
      >
        <User size={20} className={isOpen ? "text-[color:var(--primary)]" : ""} />
        <span className="font-bold hidden sm:inline">{user?.fullName?.split(" ")[0]}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[color:var(--primary)]" : "text-[color:var(--text-soft)]"}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[color:var(--surface)] border border-[color:var(--border-soft)] shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="p-4 border-b border-[color:var(--border-soft)]">
            <p className="font-extrabold text-[color:var(--text)] truncate">{user?.fullName}</p>
            <p className="text-xs font-semibold text-[color:var(--text-soft)] truncate mt-0.5">{user?.email}</p>
          </div>

          <div className="p-2 space-y-1">
            <Link
              to={ROUTES.CUSTOMER.ORDERS}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[color:var(--text)] rounded-xl hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--primary)] transition-colors"
            >
              <Package size={16} /> My Orders
            </Link>
            
            <Link
              to={ROUTES.CUSTOMER.SECURITY}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[color:var(--text)] rounded-xl hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--primary)] transition-colors"
            >
              <Shield size={16} /> Security Settings
            </Link>
          </div>

          <div className="p-2 border-t border-[color:var(--border-soft)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
