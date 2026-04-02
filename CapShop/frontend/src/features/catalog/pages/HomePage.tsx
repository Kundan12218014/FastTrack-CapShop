import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import {
  getFeaturedProducts,
  getCategories,
  type ProductDto,
  type CategoryDto,
} from "../../../api/catalogApi";
import { addToCart } from "../../../api/orderApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { showToast } from "../../../components/shared/Toast";
import { ShoppingCart, Plus, Loader2, PackageOpen, ImageIcon, ArrowRight, Tags } from "lucide-react";

// ── Skeleton ──────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div
    className="min-w-[180px] max-w-[180px] md:min-w-[220px] md:max-w-[220px] rounded-2xl p-4 animate-pulse flex-shrink-0"
    style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
  >
    <div className="w-full aspect-square rounded-xl mb-4" style={{ background: "var(--bg-elevated)" }} />
    <div className="h-4 rounded mb-3" style={{ background: "var(--bg-elevated)", width: "80%" }} />
    <div className="h-3 rounded" style={{ background: "var(--bg-elevated)", width: "50%" }} />
  </div>
);

const CategoryChipSkeleton = () => (
  <div
    className="h-10 w-28 rounded-xl animate-pulse flex-shrink-0"
    style={{ background: "var(--surface)" }}
  />
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats] = await Promise.all([
          getFeaturedProducts(8),
          getCategories(),
        ]);
        setFeatured(prods);
        setCategories(cats);
      } catch {
        showToast.error("Could not load products. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    load();
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
      showToast.success(`${product.name} added to cart!`);
    } catch {
      showToast.error("Failed to add item. Please try again.");
    } finally {
      setAddingId(null);
    }
  };

  const CATEGORY_COLORS = [
    { bg: "linear-gradient(135deg, #FFEFEF 0%, #FFF5F5 100%)", icon: "#BA1A1A" },
    { bg: "linear-gradient(135deg, #ECFDF5 0%, #F5FFF9 100%)", icon: "#006E2E" },
    { bg: "linear-gradient(135deg, #EFF6FF 0%, #F5F9FF 100%)", icon: "#1D4ED8" },
    { bg: "linear-gradient(135deg, #FFF7ED 0%, #FFFAF5 100%)", icon: "#C2410C" },
    { bg: "linear-gradient(135deg, #F5F3FF 0%, #FAF8FF 100%)", icon: "#6D28D9" },
    { bg: "linear-gradient(135deg, #ECFEFF 0%, #F5FFFF 100%)", icon: "#0E7490" },
  ];

  return (
    <div className="pb-8 w-full animate-in fade-in duration-500">

      {/* ── Category Chips ────────────────────────────────────────────────── */}
      <section className="py-6 overflow-x-auto no-scrollbar flex gap-3 px-4 md:px-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CategoryChipSkeleton key={i} />)
        ) : (
          <>
            <Link
              to={ROUTES.CUSTOMER.PRODUCTS}
              className="whitespace-nowrap px-5 py-2.5 font-bold rounded-xl text-sm transition-all hover:shadow-lg shadow-sm active:scale-95 flex-shrink-0"
              style={{ background: "var(--primary)", color: "white" }}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`${ROUTES.CUSTOMER.PRODUCTS}?categoryId=${cat.id}`}
                className="whitespace-nowrap px-5 py-2.5 font-semibold rounded-xl text-sm transition-all hover:bg-[color:var(--surface-muted)] hover:shadow-sm active:scale-95 flex-shrink-0"
                style={{
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </>
        )}
      </section>

      {/* ── Hero Banners ──────────────────────────────────────────────────── */}
      <section className="px-4 md:px-0 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Banner */}
          <Link
            to={ROUTES.CUSTOMER.PRODUCTS}
            className="lg:col-span-2 h-56 md:h-64 rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group"
            style={{ 
              background: "linear-gradient(135deg, color-mix(in oklab, var(--accent), #fff 60%) 0%, color-mix(in oklab, var(--accent), #fff 20%) 100%)",
              border: "1px solid color-mix(in oklab, var(--accent), #fff 40%)"
            }}
          >
            <div className="z-10 absolute inset-0 bg-white/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="z-20">
              <span className="font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-4 inline-block bg-white/80 text-[color:var(--text)] shadow-sm backdrop-blur-md">
                Limited Time Deals
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl leading-[1.1] mb-2 text-[color:var(--text)] max-w-sm drop-shadow-sm">
                Fresh Picks Delivered Fast
              </h2>
              <p className="text-[color:var(--text-soft)] font-medium text-sm md:text-base max-w-xs">
                Quality electronics, clothing, and books directly to your door in minutes.
              </p>
            </div>
            
            {/* Abstract Decorative Elements */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[color:var(--accent)] rounded-full blur-3xl opacity-30 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute right-4 bottom-4 text-[color:var(--accent)]/40 p-4 bg-white/30 rounded-2xl backdrop-blur-md border border-white/40 shadow-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
               <PackageOpen size={64} className="drop-shadow-sm" />
            </div>
          </Link>

          {/* Secondary Banner */}
          <Link
            to={ROUTES.CUSTOMER.CART}
            className="h-56 md:h-64 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 group"
            style={{ 
              background: "linear-gradient(135deg, color-mix(in oklab, var(--primary), #fff 60%) 0%, color-mix(in oklab, var(--primary), #fff 20%) 100%)",
              border: "1px solid color-mix(in oklab, var(--primary), #fff 40%)"
            }}
          >
             <div className="z-10 absolute inset-0 bg-white/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="z-20">
              <h3 className="font-heading font-extrabold text-2xl md:text-3xl leading-snug text-[color:var(--primary-strong)] drop-shadow-sm">
                Your Cart Awaits
              </h3>
              <p className="text-[color:var(--primary-strong)]/80 font-medium text-sm mt-2">
                Checkout securely today
              </p>
            </div>
            <div className="mt-auto z-20">
              <span className="bg-white/90 text-[color:var(--primary-strong)] font-bold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 shadow-sm transition-transform group-hover:scale-105">
                View Cart <ArrowRight size={14} />
              </span>
            </div>
            
            {/* Abstract Decorative Elements */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[color:var(--primary)] rounded-full blur-3xl opacity-20 group-hover:scale-110 transition-transform duration-700"></div>
            <ShoppingCart size={110} className="absolute -right-6 -bottom-4 text-[color:var(--primary)]/10 group-hover:scale-110 transition-transform duration-500 twist" />
          </Link>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="flex justify-between items-end px-4 md:px-0 mb-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight text-[color:var(--text)]">
              Trending Now
            </h2>
            <p className="text-[color:var(--text-soft)] text-sm mt-1">Our most popular items this week</p>
          </div>
          <Link
            to={ROUTES.CUSTOMER.PRODUCTS}
            className="hidden sm:flex items-center gap-1.5 font-bold text-sm text-[color:var(--primary)] hover:text-[color:var(--primary-strong)] transition-colors py-2 px-4 rounded-xl bg-[color:var(--primary)]/10 hover:bg-[color:var(--primary)]/20"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto no-scrollbar px-4 md:px-0 pb-4 pt-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : featured.length === 0 ? (
            <div className="w-full py-16 text-center bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-3xl mt-2 mx-4 md:mx-0 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-[color:var(--bg-elevated)] rounded-full flex items-center justify-center">
                <PackageOpen size={32} className="text-[color:var(--text-soft)]" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1 text-[color:var(--text)]">It's a little empty here</h3>
              <p className="text-sm font-medium text-[color:var(--text-soft)] max-w-xs mx-auto">
                No products are currently available. Check back soon or add items via the Admin dashboard.
              </p>
            </div>
          ) : (
            featured.map((product) => (
              <Link
                key={product.id}
                to={ROUTES.CUSTOMER.PRODUCT_DETAIL.replace(":id", product.id)}
                className="group min-w-[180px] max-w-[180px] md:min-w-[220px] md:max-w-[220px] rounded-2xl p-4 flex flex-col flex-shrink-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-[color:var(--surface)] border border-[color:var(--border-soft)]"
              >
                {/* Product Image Box */}
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
                      <ImageIcon size={32} className="text-[color:var(--text-soft)] opacity-50" />
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

                {/* Info Text */}
                <div className="flex flex-col flex-grow">
                  <h3 className="text-[15px] font-bold line-clamp-2 leading-snug mb-1 text-[color:var(--text)] group-hover:text-[color:var(--primary)] transition-colors">
                    {product.name}
                  </h3>
                  <span className="text-xs mb-3 text-[color:var(--text-soft)] font-medium">
                    {product.categoryName}
                  </span>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-extrabold text-[17px] text-[color:var(--text)]">
                      ₹{product.price.toFixed(0)}
                    </span>
                    <button
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-[color:var(--surface-muted)] hover:bg-[color:var(--primary)] text-[color:var(--text)] hover:text-white border border-[color:var(--border-soft)] hover:border-[color:var(--primary)] disabled:opacity-40 shadow-sm"
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
      </section>

      {/* ── Browse Categories Grid ────────────────────────────────────────── */}
      {!loading && categories.length > 0 && (
        <section className="px-4 md:px-0 mb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight text-[color:var(--text)]">
                Shop by Category
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat, i) => {
              const c = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <Link
                  key={cat.id}
                  to={`${ROUTES.CUSTOMER.PRODUCTS}?categoryId=${cat.id}`}
                  className="p-5 rounded-2xl h-32 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                  style={{ background: c.bg, border: `1px solid ${c.icon}20` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm z-10 text-[color:var(--text)]">
                    <Tags size={20} color={c.icon} />
                  </div>
                  <div className="z-10 mt-auto">
                    <span className="font-bold text-[15px] leading-tight block mb-0.5 text-[color:var(--text)] group-hover:text-[color:var(--primary)] transition-colors">
                      {cat.name}
                    </span>
                    {cat.description && (
                      <span className="text-[11px] font-medium line-clamp-1 opacity-70 text-[color:var(--text)]">
                        {cat.description}
                      </span>
                    )}
                  </div>
                  
                  {/* Background decoration */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500" style={{ background: c.icon }}></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
