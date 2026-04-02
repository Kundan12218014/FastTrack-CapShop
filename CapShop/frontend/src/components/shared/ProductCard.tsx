import { Package, Clock, Loader2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProductDto } from "../../api/catalogApi";
import { ROUTES, buildRoute } from "../../constants/routes";
import { addToCart, updateCartItem, removeCartItem } from "../../api/orderApi";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

interface Props { product: ProductDto; }

export const ProductCard = ({ product }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const cartItem = cart?.items.find(i => i.productId === product.id?.toString() || i.productId === product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate(ROUTES.LOGIN); return; }
    setLoading(true);
    try {
      await addToCart({
        productId:      product.id,
        productName:    product.name,
        unitPrice:      product.price,
        quantity:       1,
        availableStock: product.stockQuantity,
      });
      await fetchCart();
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add to cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (e: React.MouseEvent, increment: boolean) => {
    e.stopPropagation();
    if (!cartItem) return;
    setLoading(true);
    
    try {
      const newQty = increment ? cartItem.quantity + 1 : cartItem.quantity - 1;
      if (newQty <= 0) {
        await removeCartItem(cartItem.id);
      } else {
        await updateCartItem(cartItem.id, newQty, product.stockQuantity);
      }
      await fetchCart();
    } catch {
      toast.error("Failed to update quantity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-3 cursor-pointer hover:border-[#1f9347]/30 border border-[#f0f0f1] shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300 relative flex flex-col h-[280px]"
      onClick={() => navigate(buildRoute(ROUTES.CUSTOMER.PRODUCT_DETAIL, { id: product.id.toString() }))}
    >
      {/* Mock absolute Off pill */}
      <div className="absolute top-0 left-0 bg-[#0060ff] text-white text-[9px] font-bold px-1.5 py-1 rounded-br-lg rounded-tl-xl z-10 flex flex-col items-center">
        <span>14%</span><span>OFF</span>
      </div>
      <div className="bg-transparent rounded-lg h-[110px] w-full flex items-center justify-center mb-2 overflow-hidden relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name}
            className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package size={36} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#f3f4f6] text-[#4b5563] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
           <Clock size={10} /> 18 MINS
        </div>
        <h3 className="font-semibold text-gray-800 text-[13px] leading-[1.3] line-clamp-2 mb-1 min-h-[34px]">
          {product.name}
        </h3>
        <p className="text-[11px] text-gray-500 font-medium mb-1">
          {Math.floor(Math.random() * 400 + 100)}g
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="text-[12px] line-through text-gray-400 font-medium tracking-tight">
              ₹{Math.floor(product.price * 1.14)}
            </span>
            <span className="text-[14px] font-extrabold text-[#1c1c1c] tracking-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          {loading ? (
             <button disabled className="bg-gray-100 px-5 py-1.5 rounded-lg flex items-center justify-center w-[72px] h-[32px]">
               <Loader2 size={16} className="animate-spin text-gray-400" />
             </button>
          ) : cartItem ? (
             <div className="flex items-center justify-between bg-[#1f9347] text-white rounded-lg w-[72px] h-[32px] overflow-hidden select-none" onClick={e => e.stopPropagation()}>
                <button onClick={(e) => handleUpdateQty(e, false)} className="px-2 py-2 hover:bg-[#187538] active:bg-[#135d2c] transition-colors flex-1 flex items-center justify-center h-full">
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="font-bold text-[13px] px-1">{cartItem.quantity}</span>
                <button onClick={(e) => handleUpdateQty(e, true)} className="px-2 py-2 hover:bg-[#187538] active:bg-[#135d2c] transition-colors flex-1 flex items-center justify-center h-full">
                  <Plus size={14} strokeWidth={3} />
                </button>
             </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stockStatus === "OutOfStock"}
              className="bg-white border border-[#1f9347] text-[#1f9347] font-extrabold px-5 py-1.5 rounded-[6px] hover:bg-[#1f9347]/5 transition-colors active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent text-sm w-[72px] h-[32px] flex items-center justify-center shadow-sm"
            >
              {product.stockStatus === "OutOfStock" ? "SOLD" : "ADD"}
            </button>
          )}
        </div>
      </div>
       {product.stockStatus === "OutOfStock" && (
         <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full whitespace-nowrap z-10 backdrop-blur-sm">
           Out of Stock
         </div>
       )}
    </div>
  );
};