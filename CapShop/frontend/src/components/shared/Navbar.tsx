import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../store/useTheme';
import { ROUTES } from '../../constants/routes';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Moon, Sun, User, Search, MapPin, Store, Home, ReceiptText, ShoppingCart } from 'lucide-react';

export const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const isHome = location.pathname === ROUTES.CUSTOMER.HOME;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className={`w-full bg-[color:var(--surface)] sticky top-0 z-50 transition-colors duration-300 border-b border-[color:var(--border-soft)] ${!isHome ? 'shadow-sm' : ''}`}>
      
      {/* Top Bar: Location & Desktop Navigation & Actions */}
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        
        {/* Brand & Location (Left) */}
        <div className="flex items-center gap-6 cursor-pointer group">
          <Link to={ROUTES.CUSTOMER.HOME} className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-heading font-extrabold text-xl text-[color:var(--text)] tracking-tight leading-none group-hover:text-[color:var(--primary)] transition-colors">
                CapShop
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-80">
              <span className="text-[11px] font-semibold text-[color:var(--primary)] uppercase tracking-wider">Zepto-Speed</span>
              <span className="text-[color:var(--text-soft)] text-xs truncate">⚡ Delivery</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] rounded-lg">
            <MapPin size={14} className="text-[color:var(--primary)]" />
            <span className="text-sm text-[color:var(--text-soft)] truncate max-w-[200px]">42, Green Avenue, Delhi...</span>
          </div>
        </div>

        {/* Desktop Main Navigation (Center) */}
        <div className="hidden md:flex items-center gap-1">
          <Link to={ROUTES.CUSTOMER.HOME} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isActive(ROUTES.CUSTOMER.HOME) && location.pathname === ROUTES.CUSTOMER.HOME ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 'text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)]'}`}>
            <Home size={18} /> Home
          </Link>
          <Link to={ROUTES.CUSTOMER.PRODUCTS} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isActive(ROUTES.CUSTOMER.PRODUCTS) ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 'text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)]'}`}>
            <Store size={18} /> Shop
          </Link>
          {isAuthenticated && (
            <Link to={ROUTES.CUSTOMER.ORDERS} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isActive(ROUTES.CUSTOMER.ORDERS) ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 'text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)]'}`}>
              <ReceiptText size={18} /> Orders
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Desktop Search (Compact) */}
          <Link to={ROUTES.CUSTOMER.PRODUCTS} className="hidden md:flex items-center gap-2 px-3 h-10 bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] rounded-xl text-[color:var(--text-soft)] hover:text-[color:var(--primary)] transition-colors group">
            <Search size={16} />
            <span className="text-sm font-medium pr-12">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 text-[10px] font-mono bg-[color:var(--surface)] text-[color:var(--text-soft)] rounded border border-[color:var(--border-soft)] shadow-sm">
              Ctrl K
            </kbd>
          </Link>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] flex items-center justify-center text-[color:var(--text-soft)] hover:text-[color:var(--text)] hover:bg-[color:var(--border-soft)] transition-colors active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Desktop Cart */}
          <Link 
            to={ROUTES.CUSTOMER.CART}
            className={`hidden md:flex relative w-10 h-10 rounded-full bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] items-center justify-center transition-colors hover:text-[color:var(--primary)] hover:border-[color:var(--primary)]/30 ${isActive(ROUTES.CUSTOMER.CART) ? 'text-[color:var(--primary)]' : 'text-[color:var(--text-soft)]'}`}
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-[20px] h-[20px] rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-[color:var(--primary)] shadow-sm border-2 border-[color:var(--surface)]">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* User Profile */}
          <Link 
            to={isAuthenticated ? ROUTES.CUSTOMER.ORDERS : ROUTES.LOGIN}
            className="w-10 h-10 rounded-full bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] flex items-center justify-center text-[color:var(--text-soft)] hover:text-[color:var(--text)] hover:border-[color:var(--primary)]/30 transition-colors active:scale-95 overflow-hidden"
          >
            <User size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile Global Search Bar (Conditionally expanded to full width) */}
      <div className={`md:hidden px-4 pb-3 pt-1 transition-all ${isHome ? 'block' : 'hidden'}`}>
        <Link to={ROUTES.CUSTOMER.PRODUCTS} className="w-full bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] rounded-xl h-11 flex items-center px-4 shadow-sm hover:shadow-md transition-shadow gap-3 group">
          <Search size={18} className="text-[color:var(--text-soft)] group-hover:text-[color:var(--primary)] transition-colors" />
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-sm font-semibold text-[color:var(--text)] leading-tight">Search for "Apples"</span>
          </div>
        </Link>
      </div>
      
    </nav>
  );
};
