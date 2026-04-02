import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  type CartDto,
} from "../../../api/orderApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { showToast } from "../../../components/shared/Toast";
import { ShoppingCart, ShoppingBag, ArrowRight, Trash2, Plus, Minus, Image as ImageIcon, CreditCard } from "lucide-react";

const CartSkeleton = () => (
  <div className="flex-1 space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="flex gap-4 p-4 rounded-2xl animate-pulse bg-[color:var(--surface)] border border-[color:var(--border-soft)]"
      >
        <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-[color:var(--bg-elevated)]" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 rounded bg-[color:var(--bg-elevated)] w-3/4" />
          <div className="h-3 rounded bg-[color:var(--bg-elevated)] w-1/3" />
          <div className="h-8 rounded-lg bg-[color:var(--bg-elevated)] w-32 mt-2" />
        </div>
      </div>
    ))}
  </div>
);

export const CartPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { setItemCount } = useCartStore();

  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCart = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await getCart();
      setCart(data);
      setItemCount(data.itemCount);
    } catch {
      showToast.error("Could not load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, [isAuthenticated]);

  const handleUpdate = async (itemId: string, qty: number, stock: number) => {
    setUpdatingId(itemId);
    try {
      await updateCartItem(itemId, qty, stock);
      await loadCart();
    } catch {
      showToast.error("Failed to update item.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await removeCartItem(itemId);
      showToast.success("Item removed from cart.");
      await loadCart();
    } catch {
      showToast.error("Failed to remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 gap-5 text-center min-h-[70vh]">
        <div className="w-24 h-24 rounded-full bg-[color:var(--surface-muted)] flex items-center justify-center border border-[color:var(--border-soft)] shadow-sm">
          <ShoppingCart size={40} className="text-[color:var(--primary)] opacity-50" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-extrabold mb-1.5 text-[color:var(--text)]">Cart Access required</h1>
          <p className="text-sm font-medium text-[color:var(--text-soft)] max-w-xs mx-auto">
            You need to be logged in to view and save your selections.
          </p>
        </div>
        <Link
          to={ROUTES.LOGIN}
          className="btn-primary mt-2 px-8 h-12 inline-flex items-center"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;
  const isEmpty = !loading && items.length === 0;

  return (
    <div className="w-full max-w-screen-xl mx-auto md:px-4 py-4 md:py-8 min-h-[85vh] animate-in fade-in">
      
      {/* Page Header (Desktop only visually since layout wraps everything) */}
      <div className="px-4 md:px-0 mb-6 py-2 flex items-end justify-between border-b border-[color:var(--border-soft)] md:border-none pb-4 md:pb-0">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight text-[color:var(--text)]">
            Shopping Cart
          </h1>
          {!loading && !isEmpty && (
            <p className="text-sm font-semibold text-[color:var(--text-soft)] mt-1">
              You have {items.length} item{items.length !== 1 ? "s" : ""} in your cart
            </p>
          )}
        </div>
        <Link
          to={ROUTES.CUSTOMER.PRODUCTS}
          className="hidden md:inline-flex text-sm font-bold text-[color:var(--primary)] bg-[color:var(--primary)]/10 hover:bg-[color:var(--primary)]/20 px-4 py-2 rounded-xl transition-colors items-center gap-1.5"
        >
          <Plus size={16} /> Continue Shopping
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start px-4 md:px-0">
        
        {/* ── Main Left Side (Cart Items) ── */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {loading ? (
            <CartSkeleton />
          ) : isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl shadow-sm">
              <div className="w-24 h-24 rounded-full bg-[color:var(--bg-elevated)] flex items-center justify-center mb-6 border border-[color:var(--border-soft)]">
                <ShoppingBag size={48} className="text-[color:var(--text-soft)] opacity-40" />
              </div>
              <h2 className="text-xl md:text-2xl font-heading font-extrabold mb-2 text-[color:var(--text)]">Your cart is empty</h2>
              <p className="text-sm md:text-base font-medium text-[color:var(--text-soft)] mb-8 max-w-sm">
                Looks like you haven't added anything yet. 
                Start exploring our zepto-speed delivery items!
              </p>
              <Link
                to={ROUTES.CUSTOMER.PRODUCTS}
                className="btn-primary px-8 h-12 shadow-[0_4px_16px_-6px_var(--primary)]"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 md:p-5 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border-soft)] shadow-sm transition-all hover:shadow-md"
                  style={{ opacity: updatingId === item.id ? 0.6 : 1 }}
                >
                  {/* Image Placeholder */}
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <ImageIcon size={32} className="text-[color:var(--text-soft)] opacity-30" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1 border-b border-[color:var(--border-soft)] pb-3">
                        <div>
                            <h4 className="font-bold text-[15px] md:text-base leading-snug mb-1 text-[color:var(--text)]">
                                {item.productName}
                            </h4>
                            <p className="text-xs md:text-sm font-semibold text-[color:var(--text-soft)] flex items-center gap-1.5">
                                ₹{item.unitPrice.toFixed(0)} <span className="opacity-50">per item</span>
                            </p>
                        </div>
                        <div className="text-right">
                             <div className="font-extrabold text-[#111827] text-lg md:text-xl font-heading text-[color:var(--text)]">
                                ₹{item.lineTotal.toFixed(0)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                      {/* Stepper Inside Card */}
                      <div className="flex items-center rounded-xl bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] shadow-sm h-10 overflow-hidden">
                        <button
                          className="w-10 h-10 flex items-center justify-center text-[color:var(--text)] hover:bg-[color:var(--border-soft)] transition-colors disabled:opacity-30"
                          onClick={() => {
                            if (item.quantity > 1) handleUpdate(item.id, item.quantity - 1, 999);
                            else handleRemove(item.id);
                          }}
                          disabled={updatingId === item.id}
                        >
                           {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                        </button>
                        <div className="flex items-center justify-center min-w-[32px] font-bold text-sm bg-[color:var(--surface)] h-full border-x border-[color:var(--border-soft)]">
                            {item.quantity}
                        </div>
                        <button
                          className="w-10 h-10 flex items-center justify-center text-[color:var(--text)] hover:bg-[color:var(--border-soft)] transition-colors disabled:opacity-30"
                          onClick={() => handleUpdate(item.id, item.quantity + 1, 999)}
                          disabled={updatingId === item.id}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 transition-colors disabled:opacity-50"
                        onClick={() => handleRemove(item.id)}
                        disabled={updatingId === item.id}
                      >
                        <Trash2 size={14} /> <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop Summary Panel (Right side) ── */}
        {!isEmpty && !loading && (
          <div className="w-full lg:w-[380px] lg:sticky lg:top-24 flex-shrink-0">
             <div className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl p-6 shadow-md overflow-hidden relative">
                {/* Decorative blob inside bill details */}
               <div className="absolute top-0 right-0 w-48 h-48 bg-[color:var(--primary)]/5 rounded-full blur-3xl pointer-events-none"></div>

               <h3 className="font-heading font-extrabold text-lg mb-6 text-[color:var(--text)] flex items-center gap-2">
                 Order Summary
               </h3>
               
               <div className="space-y-4 mb-6 relative z-10">
                 <div className="flex justify-between items-center text-[15px] font-semibold text-[color:var(--text-soft)] pb-4 border-b border-[color:var(--border-soft)]">
                   <span>Item Total ({items.length})</span>
                   <span className="text-[color:var(--text)]">₹{total.toFixed(0)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[15px] font-semibold text-[color:var(--text-soft)] pb-4 border-b border-[color:var(--border-soft)]">
                   <span>Tax & Fees</span>
                   <span className="text-[color:var(--text)]">₹0</span>
                 </div>
                 <div className="flex justify-between items-center text-[15px] font-semibold text-[color:var(--primary)] pb-4">
                   <span>Express Delivery</span>
                   <span className="uppercase tracking-wide font-bold">Free</span>
                 </div>
               </div>

               <div className="mb-8 pt-4 border-t-2 border-dashed border-[color:var(--border-soft)] flex justify-between items-end relative z-10">
                 <div>
                    <span className="text-xs uppercase tracking-widest font-bold text-[color:var(--text-soft)] mb-1 block">To Pay</span>
                    <span className="font-heading font-black text-3xl md:text-4xl leading-none text-[color:var(--text)]">
                    ₹{total.toFixed(0)}
                    </span>
                 </div>
               </div>

               <Link
                 to={ROUTES.CUSTOMER.CHECKOUT}
                 className="btn-primary w-full h-[54px] text-[15px] shadow-[0_4px_16px_-6px_var(--primary)] flex items-center justify-center gap-2"
               >
                 <CreditCard size={18} />
                 PROCEED TO CHECKOUT
               </Link>

               <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[color:var(--text-soft)]">
                  <ShoppingCart size={14} className="opacity-80" /> Secure encrypted checkout
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Floating Continue Shopping for Mobile Bottom if empty */}
      {isEmpty && (
        <div className="md:hidden fixed bottom-6 left-6 right-6">
           <Link
                to={ROUTES.CUSTOMER.PRODUCTS}
                className="btn-primary w-full shadow-xl"
              >
                Shop Now
            </Link>
        </div>
      )}
    </div>
  );
};
