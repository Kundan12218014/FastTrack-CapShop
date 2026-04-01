import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, RotateCcw, Shield } from "lucide-react";
import { getFeaturedProducts, getCategories, type ProductDto, type CategoryDto } from "../../../api/catalogApi";
import { ProductCard } from "../../../components/shared/ProductCard";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";

const categoryIcons: Record<string, string> = {
  "Electronics":    "📱",
  "Clothing":       "👕",
  "Home & Kitchen": "🏠",
  "Books":          "📚",
  "Sports":         "⚽",
  "Mobiles":        "📱",
  "Laptops":        "💻",
  "Fashion":        "👗",
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [featured,   setFeatured]   = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([getFeaturedProducts(8), getCategories()])
      .then(([f, c]) => { setFeatured(f); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero Banner (Wf01) ─────────────────────────────────────── */}
      <section className="bg-[linear-gradient(135deg,#1f6a3b_0%,#2d7e49_50%,#f5b433_160%)] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
              Shop Electronics<br />& Fashion
            </h1>
            <p className="text-emerald-50/90 text-base md:text-lg mb-2">
              Fast delivery • Easy returns • Secure payments
            </p>
            <div className="flex gap-3 mt-7 flex-wrap">
              <button
                onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
                className="bg-white text-emerald-800 px-6 py-2.5 rounded-xl font-bold text-sm
                           hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
              >
                Shop Now
              </button>
              <button
                onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
                className="border border-white/50 text-white px-6 py-2.5 rounded-xl font-bold text-sm
                           hover:bg-white/10 transition-all active:scale-95"
              >
                View Deals
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex gap-6 mt-10 flex-wrap">
            {[
              { icon: Zap,       label: "Fast Delivery"    },
              { icon: RotateCcw, label: "Easy Returns"     },
              { icon: Shield,    label: "Secure Payments"  },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-emerald-50/80">
                <Icon size={16} className="text-amber-300" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Category Cards (Wf01) ──────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-extrabold text-[color:var(--primary-strong)]">Shop by Category</h2>
          </div>
          {loading ? <Loader /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`${ROUTES.CUSTOMER.PRODUCTS}?categoryId=${cat.id}`)}
                  className="card p-4 text-left hover:shadow-md hover:border-primary/30
                             hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="text-3xl mb-2">
                    {categoryIcons[cat.name] ?? "🛍️"}
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Featured Products ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-extrabold text-[color:var(--primary-strong)]">Featured Products</h2>
            <button
              onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
              className="flex items-center gap-1 text-sm text-[color:var(--primary)] font-semibold hover:opacity-80"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? <Loader /> : featured.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-400">No featured products yet. Add products via the Admin panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};