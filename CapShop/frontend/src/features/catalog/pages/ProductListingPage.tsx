import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, getCategories, type ProductDto, type CategoryDto } from "../../../api/catalogApi";
import { ProductCard } from "../../../components/shared/ProductCard";
import { Loader } from "../../../components/shared/Loader";

export const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products,   setProducts]   = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state from URL params
  const query      = searchParams.get("query")      ?? "";
  const categoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const page       = searchParams.get("page")       ? Number(searchParams.get("page"))       : 1;
  const sortBy     = searchParams.get("sortBy")     ?? "name";

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
    // Hardcoding pageSize to 15 for a denser grid
    getProducts({ query, categoryId, sortBy, page, pageSize: 15 })
      .then(result => {
        setProducts(result.items);
        setTotalPages(result.totalPages);
      })
      .finally(() => setLoading(false));
  }, [query, categoryId, sortBy, page]);

  // Determine dynamic title
  const activeCategory = categories.find(c => c.id === categoryId);
  const headerTitle = query 
    ? `Search Results for "${query}"`
    : activeCategory 
      ? `Buy ${activeCategory.name} Online`
      : "Buy Health & Daily Essentials Online";

  return (
    <div className="bg-[#f6f7f8] min-h-screen">
      <div className="max-w-[1400px] mx-auto bg-white min-h-[calc(100vh-60px)] shadow-[0_0_12px_rgba(0,0,0,0.03)] border-x border-[#f0f0f0] flex">
        
        {/* ── Left Sidebar (Categories) ────────────────────────── */}
        <aside className="w-[18%] lg:w-[15%] hidden md:block border-r border-[#f0f0f0] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto hide-scrollbar pt-2">
          <div className="flex flex-col">
             <button
                onClick={() => updateParam("categoryId", undefined)}
                className={`w-full text-left px-4 py-3 text-[13px] font-semibold transition-colors flex items-center justify-between
                  ${!categoryId ? "bg-[#f2fcf5] text-[#1f9347] border-l-4 border-[#1f9347]" : "text-gray-600 border-l-4 border-transparent hover:bg-[#fafafa]"}`}
              >
                All Categories
              </button>
              {categories.map(c => {
                const isActive = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => updateParam("categoryId", String(c.id))}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 leading-snug transition-colors group border-l-4
                      ${isActive ? "bg-[#f2fcf5] border-[#1f9347]" : "border-transparent hover:bg-[#fafafa]"}`}
                  >
                    <div className="w-10 h-10 rounded-[8px] bg-[#f8f8f8] shrink-0 hidden lg:flex items-center justify-center overflow-hidden border border-[#eee] group-hover:border-[#ddd] transition-colors">
                       <img src={`https://ui-avatars.com/api/?name=${c.name}&background=random&color=fff&size=40`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className={`text-[12px] mt-1 pr-1 leading-[1.3] ${isActive ? "text-[#1f9347] font-extrabold" : "text-gray-600 font-semibold"}`}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* ── Main Product Area ─────────────────────────────────── */}
        <div className="flex-1 px-4 lg:px-6 py-6 overflow-hidden">
          {/* Dynamic Top Header */}
          <div className="flex items-center justify-between mb-4 border-b border-[#f0f0f0] pb-3">
             <h1 className="text-[20px] font-extrabold text-[#111] tracking-tight">{headerTitle}</h1>
             <div className="flex items-center gap-2">
               <span className="text-[12px] font-bold text-gray-400">Sort By</span>
               <select
                  value={sortBy}
                  onChange={e => updateParam("sortBy", e.target.value)}
                  className="text-[12px] font-semibold text-gray-600 bg-[#f8f8f8] border border-[#e8e8e8] rounded-md px-2 py-1 outline-none focus:border-[#1f9347]"
                >
                  <option value="name">Name (A–Z)</option>
                  <option value="price_asc">Price: Low–High</option>
                  <option value="price_desc">Price: High–Low</option>
                  <option value="newest">Newest First</option>
                </select>
             </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><Loader /></div>
          ) : products.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <img src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png" className="w-24 h-24 mb-4 opacity-50 grayscale" alt="Empty" />
              <p className="text-gray-500 font-bold text-lg">No products found.</p>
              <p className="text-gray-400 text-sm mt-1">Try a different category or search term.</p>
            </div>
          ) : (
            <>
              {/* Tight Zepto-style Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[12px]">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Minimal Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10 border-t border-[#f0f0f0] pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    className="p-1.5 rounded-md border border-[#e8e8e8] disabled:opacity-30 hover:bg-gray-50 text-gray-500"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => updateParam("page", String(p))}
                        className={`w-8 h-8 rounded-md text-[13px] font-bold transition-colors
                          ${p === page
                            ? "bg-[#1f9347] text-white border border-[#1f9347]"
                            : "bg-white text-gray-600 border border-[#e8e8e8] hover:bg-[#fafafa]"}`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    className="p-1.5 rounded-md border border-[#e8e8e8] disabled:opacity-30 hover:bg-gray-50 text-gray-500"
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