import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, getCategories, type ProductDto, type CategoryDto } from "../../../api/catalogApi";
import { ProductCard } from "../../../components/shared/ProductCard";
import { Loader } from "../../../components/shared/Loader";

const SORT_OPTIONS = [
  { value: "name",       label: "Name (A–Z)"       },
  { value: "price_asc",  label: "Price: Low–High"  },
  { value: "price_desc", label: "Price: High–Low"  },
  { value: "newest",     label: "Newest First"     },
];

export const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products,   setProducts]   = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state from URL params
  const query      = searchParams.get("query")      ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const minPrice   = searchParams.get("minPrice")   ? Number(searchParams.get("minPrice"))   : undefined;
  const maxPrice   = searchParams.get("maxPrice")   ? Number(searchParams.get("maxPrice"))   : undefined;
  const sortBy     = searchParams.get("sortBy")     ?? "name";
  const page       = searchParams.get("page")       ? Number(searchParams.get("page"))       : 1;

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ query, categoryId, minPrice, maxPrice, sortBy, page, pageSize: 12 })
      .then(result => {
        setProducts(result.items);
        setTotal(result.totalCount);
        setTotalPages(result.totalPages);
      })
      .finally(() => setLoading(false));
  }, [query, categoryId, minPrice, maxPrice, sortBy, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ── Search + Sort Bar (Wf03) ──────────────────────────────── */}
      <div className="card p-3.5 mb-5 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-soft)]" />
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={query}
            onKeyDown={e => { if (e.key === "Enter") updateParam("query", (e.target as HTMLInputElement).value); }}
            className="input-field pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => updateParam("sortBy", e.target.value)}
          className="input-field w-auto min-w-[160px]"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
          <span className="text-sm text-[color:var(--text-soft)] whitespace-nowrap font-medium">
          {total} results
        </span>
      </div>

      <div className="flex gap-5">

        {/* ── Filter Sidebar (Wf03) ─────────────────────────────────── */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="card p-4 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={16} className="text-primary" />
              <h3 className="font-extrabold text-[color:var(--primary-strong)] text-sm">Filters</h3>
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="category" checked={!categoryId}
                    onChange={() => updateParam("categoryId", undefined)}
                    className="accent-primary" />
                  <span className="text-sm text-gray-700">All</span>
                </label>
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="category" checked={categoryId === c.id}
                      onChange={() => updateParam("categoryId", String(c.id))}
                      className="accent-primary" />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price</p>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Min"
                  defaultValue={minPrice}
                  onBlur={e => updateParam("minPrice", e.target.value || undefined)}
                  className="input-field text-xs py-1.5"
                />
                <input
                  type="number" placeholder="Max"
                  defaultValue={maxPrice}
                  onBlur={e => updateParam("maxPrice", e.target.value || undefined)}
                  className="input-field text-xs py-1.5"
                />
              </div>
            </div>

            {/* Clear filters */}
            {(categoryId || minPrice || maxPrice || query) && (
              <button
                onClick={() => setSearchParams({})}
                className="mt-4 text-xs text-danger hover:underline w-full text-left font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* ── Product Grid (Wf03) ───────────────────────────────────── */}
        <div className="flex-1">
          {loading ? <Loader /> : products.length === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-gray-400 text-lg">No products found.</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => updateParam("page", String(p))}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                          ${p === page
                            ? "bg-primary text-white"
                            : "border border-gray-200 hover:bg-gray-50"}`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};