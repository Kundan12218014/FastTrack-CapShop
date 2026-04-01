import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { getCart, updateCartItem, removeCartItem, type CartDto } from "../../../api/orderApi";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";
import toast from "react-hot-toast";

export const CartPage = () => {
  const navigate = useNavigate();
  const [cart,    setCart]    = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon,  setCoupon]  = useState("");

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleQtyChange = async (itemId: string, newQty: number, stock: number) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(itemId, newQty, stock);
      await fetchCart();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not update quantity.");
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      toast.success("Item removed");
      await fetchCart();
    } catch {
      toast.error("Could not remove item.");
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><Loader /></div>;

  const isEmpty = !cart || cart.items.length === 0;
  const gst       = cart ? Math.round(cart.total * 0.18) : 0;
  const delivery  = cart && cart.total > 499 ? 0 : 49;
  const grandTotal = cart ? cart.total + gst + delivery : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-primary mb-6">
        {/* Wf05 — Cart title */}
        Cart Items
        {!isEmpty && (
          <span className="text-base font-normal text-gray-400 ml-2">
            ({cart?.itemCount} items)
          </span>
        )}
      </h1>

      {isEmpty ? (
        <div className="card p-16 text-center">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-gray-400 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-6">Add products to start shopping</p>
          <button onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Cart Table (Wf05) ─────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span className="col-span-5">Item</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Subtotal</span>
                <span className="col-span-1 text-right">Remove</span>
              </div>

              {/* Cart rows */}
              {cart!.items.map(item => (
                <div key={item.id}
                  className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">

                  {/* Item */}
                  <div className="col-span-5">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {item.productId.slice(0, 8)}</p>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right text-sm font-medium text-gray-700">
                    ₹{item.unitPrice.toLocaleString("en-IN")}
                  </div>

                  {/* Qty stepper */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm">
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity - 1, 99)}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600"
                      >−</button>
                      <span className="px-2 py-1 font-semibold min-w-[28px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity + 1, 99)}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600"
                      >+</button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-2 text-right text-sm font-bold text-primary">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-danger hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel (Wf05) ───────────────────────────────────── */}
          <div className="space-y-4">

            {/* Order Summary */}
            <div className="card p-5">
              <h3 className="font-bold text-primary mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cart!.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={delivery === 0 ? "text-success" : ""}>
                    {delivery === 0 ? "FREE" : `₹${delivery}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-primary">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Add ₹{(499 - cart!.total).toFixed(0)} more for free delivery
                </p>
              )}
            </div>

            {/* Proceed to Checkout */}
            <button
              onClick={() => navigate(ROUTES.CUSTOMER.CHECKOUT)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>

            {/* Coupons (optional) */}
            <div className="card p-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Tag size={14} /> Coupons
              </h4>
              <p className="text-xs text-gray-400 mb-2">Apply coupon code (optional)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                  className="input-field text-sm py-2"
                />
                <button
                  onClick={() => toast.success("Coupon feature coming soon!")}
                  className="btn-secondary text-sm px-4 py-2 whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};