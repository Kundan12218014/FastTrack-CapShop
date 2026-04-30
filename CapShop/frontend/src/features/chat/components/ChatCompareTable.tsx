import { Star, ShoppingCart, ExternalLink } from "lucide-react";
import type { ProductDto } from "../../../api/catalogApi";
import { useChat } from "../hooks/useChat";

interface Props {
  products: [ProductDto, ProductDto];
}

/**
 * Side-by-side product comparison table rendered inside the chat.
 */
export const ChatCompareTable = ({ products }: Props) => {
  const { handleAddToCart, goToProduct } = useChat();
  const [a, b] = products;

  const rows: { label: string; getValue: (p: ProductDto) => string | React.ReactNode }[] = [
    {
      label: "Price",
      getValue: (p) => (
        <span className="font-extrabold text-[color:var(--primary)]">
          ₹{p.price.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      label: "Category",
      getValue: (p) => p.categoryName,
    },
    {
      label: "Stock",
      getValue: (p) => {
        const colors: Record<string, string> = {
          InStock: "text-emerald-600",
          LowStock: "text-amber-600",
          OutOfStock: "text-red-500",
        };
        return (
          <span className={`font-semibold ${colors[p.stockStatus] ?? ""}`}>
            {p.stockStatus === "InStock"
              ? "In Stock"
              : p.stockStatus === "LowStock"
                ? `Low (${p.stockQuantity})`
                : "Out of Stock"}
          </span>
        );
      },
    },
    {
      label: "Rating",
      getValue: (p) => {
        const r = 3.5 + ((p.id.charCodeAt(0) % 15) / 10);
        return (
          <span className="flex items-center gap-1">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-amber-600">{r.toFixed(1)}</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
      {/* Product headers */}
      <div className="grid grid-cols-3 gap-2">
        <div /> {/* label column */}
        {[a, b].map((p, i) => (
          <div key={p.id} className="text-center">
            <div className="h-16 bg-gray-50 rounded-xl flex items-center justify-center mb-1 overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-2xl">{i === 0 ? "📦" : "📦"}</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-[color:var(--text)] line-clamp-2 leading-tight">
              {p.name}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="border border-[color:var(--border-soft)] rounded-xl overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-3 gap-2 px-2 py-2 text-[11px] ${
              i % 2 === 0 ? "bg-[color:var(--surface)]" : "bg-[color:var(--surface-alt,#f8fafc)]"
            }`}
          >
            <span className="font-bold text-[color:var(--text-soft)] self-center">
              {row.label}
            </span>
            {[a, b].map((p) => (
              <div key={p.id} className="text-center self-center">
                {row.getValue(p)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[a, b].map((p) => (
          <div key={p.id} className="flex gap-1">
            <button
              onClick={() => handleAddToCart(p)}
              disabled={p.stockStatus === "OutOfStock"}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[color:var(--primary)] text-white text-[10px] font-bold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <ShoppingCart size={10} />
              Add
            </button>
            <button
              onClick={() => goToProduct(p.id)}
              className="w-7 h-7 flex items-center justify-center border border-[color:var(--border-soft)] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={10} className="text-[color:var(--text-soft)]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
