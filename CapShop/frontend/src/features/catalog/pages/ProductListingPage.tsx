import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import {
  getProducts,
  getCategories,
  type ProductDto,
  type CategoryDto,
} from "../../../api/catalogApi";
import { addToCart } from "../../../api/orderApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { showToast } from "../../../components/shared/Toast";
import { ArrowLeft, Search, X, LayoutGrid, Tags, Image as ImageIcon, Loader2, Plus, SearchX } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Name A–Z", value: "name" },
  { label: "Name Z–A", value: "name_desc" },
  { label: "Price: Low→High", value: "price_asc" },
  { label: "Price: High→Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
];

const ProductSkeleton = () => (
  <div
    className="rounded-2xl p-4 animate-pulse flex flex-col"
    style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
  >
    <div className="w-full aspect-square rounded-xl mb-4" style={{ background: "var(--bg-elevated)" }} />
    <div className="h-4 rounded mb-2" style={{ background: "var(--bg-elevated)", width: "75%" }} />
    <div className="h-4 rounded mb-4" style={{ background: "var(--bg-elevated)", width: "50%" }} />
    <div className="h-9 rounded-xl mt-auto" style={{ background: "var(--bg-elevated)" }} />
  </div>
);

export const ProductListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(searchParams.get("query") ?? "");

  const query = searchParams.get("query") ?? undefined;
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const sortBy = searchParams.get("sortBy") ?? "name";
  const page = Number(searchParams.get("page") ?? "1");

  const setParam = (key: string, value: string | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.set("page", "1");
      return next;
    });
  };

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({ query, categoryId, sortBy, page, pageSize: 12 });
      setProducts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch {
      showToast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [query, categoryId, sortBy, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: ProductDto) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast.error("Please login to add items to cart.");
      navigate(ROUTES.LOGIN);
      return;
    }
    if (product.stockStatus === "OutOfStock") {
      showToast.error("This product is out of stock.");
      return;
    }
    setAddingId(product.id);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        availableStock: product.stockQuantity,
      });
      increment();
      showToast.success(`${product.name} added!`);
    } catch {
      showToast.error("Failed to add item.");
    } finally {
      setAddingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("query", searchInput.trim() || undefined);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col md:flex-row w-full max-w-screen-xl mx-auto md:px-4 md:py-6 gap-6 min-h-[85vh]">

      {/* ── Desktop: Left Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 relative">
        <div className="sticky top-24 bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-2xl p-4 shadow-sm">
          <h2 className="font-heading font-extrabold text-lg mb-4 text-[color:var(--text)] px-2">Categories</h2>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setParam("categoryId", undefined)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${!categoryId ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)] font-bold" : "text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)] font-semibold"}`}
            >
              <LayoutGrid size={18} />
              <span>All Products</span>
            </button>
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setParam("categoryId", String(cat.id))}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)] font-bold" : "text-[color:var(--text-soft)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)] font-semibold"}`}
                >
                  <Tags size={18} />
                  <span className="line-clamp-1 text-left">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col w-full">

        {/* ── Mobile: Search + Horizontal Categories ──────────────────────── */}
        <div className="md:hidden sticky top-[64px] z-20 bg-[color:var(--bg)] border-b border-[color:var(--border-soft)] pb-3 shadow-sm pt-3">
          
          <div className="flex items-center gap-3 px-4 mb-3">
            <Link
              to={ROUTES.CUSTOMER.HOME}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[color:var(--surface)] border border-[color:var(--border-soft)] text-[color:var(--text-soft)] hover:text-[color:var(--text)] shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>

            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 h-11 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border-soft)] shadow-sm focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary)]/20 transition-all">
                <Search size={18} className="text-[color:var(--text-soft)]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-[color:var(--text)] placeholder:text-[color:var(--text-soft)] placeholder:opacity-70"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setParam("query", undefined); }}
                    className="text-[color:var(--text-soft)] hover:text-[color:var(--text)] p-1"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="hidden">Search</button>
            </form>
          </div>

          {/* Mobile Category Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
             <button
                onClick={() => setParam("categoryId", undefined)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] transition-all flex-shrink-0 ${!categoryId ? "bg-[color:var(--primary)] text-white font-bold" : "bg-[color:var(--surface)] border border-[color:var(--border-soft)] text-[color:var(--text)] font-semibold"}`}
              >
                All
              </button>
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setParam("categoryId", String(cat.id))}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] transition-all flex-shrink-0 ${active ? "bg-[color:var(--primary)] text-white font-bold shadow-sm" : "bg-[color:var(--surface)] border border-[color:var(--border-soft)] text-[color:var(--text)] font-semibold"}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Desktop Search & Sort Header ─────────────────────────────────── */}
        <div className="px-4 md:px-0 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-[color:var(--text)]">
              {selectedCategory ? selectedCategory.name : "All Products"}
              {!loading && (
                <span className="ml-2 text-base font-semibold text-[color:var(--text-soft)]">
                  {totalCount} items
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="w-64 flex items-center gap-2 px-3 h-10 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border-soft)] shadow-sm focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary)]/20 transition-all">
                <Search size={16} className="text-[color:var(--text-soft)]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[color:var(--text)]"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setParam("query", undefined); }}
                    className="text-[color:var(--text-soft)] hover:text-[color:var(--text)] p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            <select
              value={sortBy}
              onChange={(e) => setParam("sortBy", e.target.value)}
              className="h-10 text-sm font-semibold px-3 pr-2 rounded-xl outline-none shadow-sm cursor-pointer"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Product Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 px-3 md:px-0 pb-8 animate-in fade-in duration-500 delay-100 fill-mode-both">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length === 0 ? (
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 py-20 flex flex-col items-center text-center bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl shadow-sm mt-4">
              <div className="w-16 h-16 bg-[color:var(--bg-elevated)] rounded-full flex items-center justify-center mb-4">
                <SearchX size={32} className="text-[color:var(--text-soft)]" />
              </div>
              <h2 className="font-heading font-extrabold text-lg text-[color:var(--text)] mb-1">No products found</h2>
              <p className="text-[color:var(--text-soft)] text-sm font-medium mb-4 max-w-sm">
                We couldn't find anything matching your criteria. Try adjusting your filters or search query.
              </p>
              {query && (
                <button
                  onClick={() => { setSearchInput(""); setParam("query", undefined); }}
                  className="btn-primary"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                to={ROUTES.CUSTOMER.PRODUCT_DETAIL.replace(":id", product.id)}
                className="group rounded-2xl p-3 md:p-4 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-[color:var(--surface)] border border-[color:var(--border-soft)] relative overflow-hidden"
              >
                {/* Image */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-[color:var(--bg-elevated)]">
                  {product.imageUrl ? (
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[color:var(--surface-muted)]">
                      <ImageIcon size={32} className="text-[color:var(--text-soft)] opacity-40" />
                    </div>
                  )}
                  {product.stockStatus === "OutOfStock" && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                       <span className="text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-lg border border-white/20">
                         Out of Stock
                       </span>
                     </div>
                  )}
                  {product.stockStatus === "LowStock" && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm" style={{ background: "var(--accent)", color: "#1a0c00" }}>
                      LOW STOCK
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-grow">
                  <h3 className="text-sm md:text-[15px] font-bold line-clamp-2 leading-snug mb-1 text-[color:var(--text)] group-hover:text-[color:var(--primary)] transition-colors">
                    {product.name}
                  </h3>
                  <span className="text-xs mb-3 text-[color:var(--text-soft)] font-medium block">
                    {product.categoryName}
                  </span>
                  
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="font-extrabold text-base md:text-lg text-[color:var(--text)]">
                      ₹{product.price.toFixed(0)}
                    </span>
                    <button
                      className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all bg-[color:var(--surface-muted)] hover:bg-[color:var(--primary)] text-[color:var(--text)] hover:text-white border border-[color:var(--border-soft)] hover:border-[color:var(--primary)] disabled:opacity-40 shadow-sm"
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingId === product.id || product.stockStatus === "OutOfStock"}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {addingId === product.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Plus size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 pb-12 md:pb-6 px-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)] shadow-sm"
            >
              ← Prev
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 text-[color:var(--text-soft)] font-bold">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-[13px] font-bold transition-all shadow-sm mx-0.5
                        ${p === page 
                          ? "bg-[color:var(--primary)] text-white border border-[color:var(--primary)]" 
                          : "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)]"
                        }`}
                    >
                      {p}
                    </button>
                  </span>
                ))
              }
            </div>
            <span className="sm:hidden text-sm font-bold text-[color:var(--text-soft)] px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)] shadow-sm"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
