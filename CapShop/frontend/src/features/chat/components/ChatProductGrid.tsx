import type { ProductDto } from "../../../api/catalogApi";
import { ChatProductCard } from "./ChatProductCard";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { useChatStore } from "../store/chatStore";

interface Props {
  products: ProductDto[];
  /** Text search query — used for "See all" navigation */
  query?: string;
  /** Category ID — used for "See all" navigation when browsing by category */
  categoryId?: number;
}

export const ChatProductGrid = ({ products, query, categoryId }: Props) => {
  const navigate = useNavigate();
  const { closeChat } = useChatStore();

  const handleSeeAll = () => {
    // Prefer categoryId over text query for accurate filtering
    let params = "";
    if (categoryId) {
      params = `?categoryId=${categoryId}`;
    } else if (query) {
      params = `?query=${encodeURIComponent(query)}`;
    }
    navigate(`${ROUTES.CUSTOMER.PRODUCTS}${params}`);
    closeChat();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold text-[color:var(--text-soft)] uppercase tracking-wide">
          {products.length} result{products.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleSeeAll}
          className="text-[11px] font-bold text-[color:var(--primary)] hover:underline"
        >
          See all →
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 hide-scrollbar snap-x">
        {products.map((product, i) => (
          <div key={product.id} className="snap-start">
            <ChatProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
};
