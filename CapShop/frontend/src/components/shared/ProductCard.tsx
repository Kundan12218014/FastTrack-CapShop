import { ShoppingCart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProductDto } from "../../api/catalogApi";
import { StatusBadge } from "./StatusBadge";
import { ROUTES, buildRoute } from "../../constants/routes";
import { addToCart } from "../../api/orderApi";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

interface Props { product: ProductDto; }

export const ProductCard = ({ product }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate(ROUTES.LOGIN); return; }
    try {
      await addToCart({
        productId:      product.id,
        productName:    product.name,
        unitPrice:      product.price,
        quantity:       1,
        availableStock: product.stockQuantity,
      });
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add to cart.");
    }
  };

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => navigate(buildRoute(ROUTES.CUSTOMER.PRODUCT_DETAIL, { id: product.id.toString() }))}
    >
      {/* Product Image */}
      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name}
            className="w-full h-full object-cover" />
        ) : (
          <Package size={40} className="text-gray-300" />
        )}
      </div>

      {/* Category */}
      <p className="text-xs text-primary font-medium mb-1">{product.categoryName}</p>

      {/* Name */}
      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
        {product.name}
      </h3>

      {/* Price + Stock */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-primary font-display">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
        <StatusBadge status={product.stockStatus} />
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={product.stockStatus === "OutOfStock"}
        className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
      >
        <ShoppingCart size={14} />
        {product.stockStatus === "OutOfStock" ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
};