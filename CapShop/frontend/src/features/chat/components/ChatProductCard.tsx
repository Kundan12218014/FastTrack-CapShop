import { ShoppingCart, ExternalLink, Package, Star } from "lucide-react";
import type { ProductDto } from "../../../api/catalogApi";
import { useChat } from "../hooks/useChat";

interface Props {
  product: ProductDto;
  index: number;
}

const STOCK_COLORS: Record<string, string> = {
  InStock: "bg-emerald-100 text-emerald-700",
  LowStock: "bg-amber-100 text-amber-700",
  OutOfStock: "bg-red-100 text-red-600",
};

/**
 * Compact product card rendered inside the chat panel.
 * Shows image, name, price, stock badge, mock rating, and action buttons.
 */
export const ChatProductCard = ({ product, index }: Props) => {
  const { handleAddToCart, goToProduct } = useChat();

  const isOutOfStock = product.stockStatus === "OutOfStock";

  // Deterministic mock rating based on product id until real ratings are loaded
  const mockRating = 3.5 + ((product.id.charCodeAt(0) % 15) / 10);
  const mockCount = 50 + (product.id.charCodeAt(1) % 200);

  return (
    <div className="flex-shrink-0 w-[160px] bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Index badge */}
      <div className="relative">
        <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 bg-[color:var(--primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {index + 1}
        </div>

        {/* Image */}
        <div className="h-[100px] bg-gray-50 flex items-center justify-center p-2">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Package size={32} className="text-gray-300" />
          )}
        </div>
      </div>

      <div className="p-2.5 space-y-1.5">
        {/* Name */}
        <p className="text-[12px] font-semibold text-[color:var(--text)] line-clamp-2 leading-tight min-h-[32px]">
          {product.name}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-600">
            {mockRating.toFixed(1)}
          </span>
          <span className="text-[10px] text-[color:var(--text-soft)]">
            ({mockCount})
          </span>
        </div>

        {/* Price */}
        <p className="text-[14px] font-extrabold text-[color:var(--text)]">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        {/* Stock badge */}
        <span
          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            STOCK_COLORS[product.stockStatus] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {product.stockStatus === "InStock"
            ? "In Stock"
            : product.stockStatus === "LowStock"
              ? `Only ${product.stockQuantity} left`
              : "Out of Stock"}
        </span>

        {/* Actions */}
        <div className="flex gap-1 pt-1">
          <button
            onClick={() => handleAddToCart(product)}
            disabled={isOutOfStock}
            title="Add to cart"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[color:var(--primary)] text-white text-[10px] font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={11} />
            {isOutOfStock ? "Sold" : "Add"}
          </button>
          <button
            onClick={() => goToProduct(product.id)}
            title="View details"
            className="w-7 h-7 flex items-center justify-center border border-[color:var(--border-soft)] rounded-lg hover:bg-[color:var(--surface-alt,#f1f5f9)] transition-colors"
          >
            <ExternalLink size={11} className="text-[color:var(--text-soft)]" />
          </button>
        </div>
      </div>
    </div>
  );
};
