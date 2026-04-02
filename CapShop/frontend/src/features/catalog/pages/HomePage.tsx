import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFeaturedProducts, getCategories, type ProductDto, type CategoryDto } from "../../../api/catalogApi";
import { ProductCard } from "../../../components/shared/ProductCard";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";

// Blinkit-style image mapping for categories
const categoryMappings: Record<string, { img: string; bg: string }> = {
  "Electronics": { img: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png", bg: "#f0f4f9" },
  "Clothing": { img: "https://cdn-icons-png.flaticon.com/512/2806/2806214.png", bg: "#fef3f2" },
  "Home & Kitchen": { img: "https://cdn-icons-png.flaticon.com/512/2729/2729011.png", bg: "#fff7e6" },
  "Books": { img: "https://cdn-icons-png.flaticon.com/512/3145/3145765.png", bg: "#edf2ee" },
  "Sports": { img: "https://cdn-icons-png.flaticon.com/512/1165/1165187.png", bg: "#e6f4f1" },
  "Mobiles": { img: "https://cdn-icons-png.flaticon.com/512/644/644458.png", bg: "#f8f0fc" },
  "Laptops": { img: "https://cdn-icons-png.flaticon.com/512/3256/3256111.png", bg: "#eef2f5" },
  "Fashion": { img: "https://cdn-icons-png.flaticon.com/512/3159/3159614.png", bg: "#fff0f5" },
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFeaturedProducts(8), getCategories()])
      .then(([f, c]) => { setFeatured(f); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-16">
      <div className="max-w-[1200px] mx-auto px-4 pt-6">

        {/* ── Promotional Banners ────────────────────────────────────────── */}
        <section className="mt-4 mb-10 flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {/* Banner 1 */}
          <div 
            onClick={() => navigate(`${ROUTES.CUSTOMER.PRODUCTS}?query=Pharmacy`)}
            className="min-w-[320px] md:min-w-0 md:flex-1 h-48 sm:h-56 rounded-2xl p-6 relative overflow-hidden shrink-0 snap-start bg-gradient-to-br from-[#0c9ca4] to-[#128187] text-white shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="relative z-10 w-2/3">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2 font-display">Pharmacy at<br/>your doorstep!</h2>
              <p className="text-sm opacity-90 mb-4 font-medium">Cough syrups, pain relief & more</p>
              <button className="bg-white text-[#0c9ca4] font-bold px-4 py-1.5 rounded-lg text-sm shadow hover:bg-gray-50 transition-colors">
                Order Now
              </button>
            </div>
            {/* Placeholder shape for image */}
            <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          </div>

          {/* Banner 2 */}
          <div 
            onClick={() => navigate(`${ROUTES.CUSTOMER.PRODUCTS}?query=Pet`)}
            className="min-w-[320px] md:min-w-0 md:flex-1 h-48 sm:h-56 rounded-2xl p-6 relative overflow-hidden shrink-0 snap-start bg-gradient-to-br from-[#ffb900] to-[#e6a600] text-[#4d2c00] shadow-sm flex flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="relative z-10 w-2/3">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2 font-display">Pet care supplies<br/>at your door</h2>
              <p className="text-sm opacity-90 mb-4 font-medium">Food, treats, toys & more</p>
              <button className="bg-[#4d2c00] text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow hover:bg-[#331d00] transition-colors">
                Order Now
              </button>
            </div>
             {/* Placeholder shape for image */}
             <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-[#4d2c00]/10 rounded-full blur-xl pointer-events-none"></div>
          </div>

          {/* Banner 3 (Optional extra on large screens) */}
           <div 
            onClick={() => navigate(`${ROUTES.CUSTOMER.PRODUCTS}?query=Baby`)}
            className="hidden lg:flex min-w-[320px] md:min-w-0 md:flex-1 h-48 sm:h-56 rounded-2xl p-6 relative overflow-hidden shrink-0 snap-start bg-gradient-to-br from-[#bccce0] to-[#a2b5cf] text-[#1c2e4a] shadow-sm flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
           >
            <div className="relative z-10 w-2/3">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2 font-display">No time for<br/>a diaper run?</h2>
              <p className="text-sm opacity-90 mb-4 font-medium">Get baby care essentials</p>
              <button className="bg-[#1c2e4a] text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow hover:bg-[#0f1929] transition-colors">
                Order Now
              </button>
            </div>
             <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
          </div>
        </section>

        {/* ── Categories Grid ────────────────────────────────────────────── */}
        <section className="mb-14">
          {loading ? (
             <div className="flex justify-center p-12"><Loader /></div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-6">
              {categories.map((cat) => {
                const mapInfo = categoryMappings[cat.name] || { img: "https://cdn-icons-png.flaticon.com/512/3081/3081986.png", bg: "#f0f4f9" };
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`${ROUTES.CUSTOMER.PRODUCTS}?categoryId=${cat.id}`)}
                    className="flex flex-col items-center group text-center"
                  >
                    <div 
                      className="w-[85px] h-[95px] rounded-2xl flex items-center justify-center p-3 mb-2 shadow-sm border border-black/5 group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300"
                      style={{ backgroundColor: mapInfo.bg }}
                    >
                      <img 
                        src={mapInfo.img} 
                        alt={cat.name} 
                        className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300" 
                      />
                    </div>
                    <span className="text-[13px] font-bold text-gray-800 leading-tight w-full max-w-[85px] truncate px-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Featured Products Carousel ──────────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-5 px-1">
            <h2 className="font-display text-2xl font-extrabold text-[#111] tracking-tight">Top Deals & Featured Items</h2>
            <button
              onClick={() => navigate(ROUTES.CUSTOMER.PRODUCTS)}
              className="text-[#0c9ca4] font-bold text-sm tracking-wide hover:underline hover:text-[#0a7a80]"
            >
              see all
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><Loader /></div>
          ) : featured.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 font-medium">No featured products yet. Check back soon!</p>
            </div>
          ) : (
             <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar px-1 -mx-1">
               {featured.map(product => (
                 <div key={product.id} className="min-w-[190px] w-[190px] shrink-0 snap-start">
                    <ProductCard product={product} />
                 </div>
               ))}
               {/* Padder for scroll end */}
               <div className="w-[1px] shrink-0"></div>
             </div>
          )}
        </section>

      </div>
    </div>
  );
};