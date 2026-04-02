import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { getProductById, type ProductDto } from "../../../api/catalogApi";
import { addToCart } from "../../../api/orderApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { showToast } from "../../../components/shared/Toast";
import { ArrowLeft, ShoppingCart, Loader2, Image as ImageIcon, SearchX, Plus, Minus, ShieldCheck, RefreshCw, Truck } from "lucide-react";

const DetailSkeleton = () => (
  <div className="animate-pulse pb-32 w-full min-h-[85vh] max-w-screen-xl mx-auto md:px-4 md:py-6" style={{ background: "var(--bg)" }}>
    <div className="md:grid md:grid-cols-2 md:gap-8 bg-[color:var(--surface)] md:rounded-3xl md:p-6 md:border border-[color:var(--border-soft)] md:shadow-sm">
      <div className="w-full h-[45vh] md:h-full md:min-h-[500px] md:rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
      <div className="px-5 pt-8 space-y-5">
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-24 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
        </div>
        <div className="h-8 rounded-xl w-3/4" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-4 rounded-xl w-1/2" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-24 rounded-xl mt-6" style={{ background: "var(--bg-elevated)" }} />
        <div className="h-16 rounded-2xl mt-8" style={{ background: "var(--bg-elevated)" }} />
      </div>
    </div>
  </div>
);

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(id)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      showToast.error("Please login to add items to cart.");
      navigate(ROUTES.LOGIN);
      return;
    }
    if (product.stockStatus === "OutOfStock") {
      showToast.error("This product is out of stock.");
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        availableStock: product.stockQuantity,
      });
      for (let i = 0; i < quantity; i++) increment();
      showToast.success(`${product.name} added to cart!`);
    } catch {
      showToast.error("Failed to add item. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 gap-5 text-center min-h-[70vh]">
        <div className="w-20 h-20 bg-[color:var(--bg-elevated)] rounded-full flex items-center justify-center">
            <SearchX size={40} className="text-[color:var(--text-soft)]" />
        </div>
        <div>
            <h1 className="text-2xl font-heading font-extrabold text-[color:var(--text)] mb-1">Product Not Found</h1>
            <p className="text-sm text-[color:var(--text-soft)] max-w-sm mx-auto">
            This product may have been removed or the link is incorrect.
            </p>
        </div>
        <Link
          to={ROUTES.CUSTOMER.PRODUCTS}
          className="mt-4 px-8 py-3 rounded-xl font-bold text-sm text-[color:var(--primary)] bg-[color:var(--primary)]/10 hover:bg-[color:var(--primary)]/20 transition-all border border-[color:var(--primary)]/20"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockStatus === "OutOfStock";
  const isLowStock = product.stockStatus === "LowStock";

  return (
    <div className="w-full relative flex flex-col md:pb-12 max-w-screen-xl mx-auto md:px-4 md:py-6 lg:min-h-[85vh] animate-in fade-in" style={{ background: "var(--bg)" }}>

      {/* Main Container - Card on Desktop, Full Bleed on Mobile */}
      <div className="flex flex-col md:flex-row bg-[color:var(--surface)] md:border border-[color:var(--border-soft)] md:rounded-3xl shadow-sm overflow-hidden relative">

        {/* ── Mobile Header Overlay (Absolute inside container) ── */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-[color:var(--border-soft)]/50"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", color: "var(--text)" }}
          >
            <ArrowLeft size={20} />
          </button>
          <Link
            to={ROUTES.CUSTOMER.CART}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 border border-[color:var(--border-soft)]/50"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", color: "var(--text)" }}
          >
            <ShoppingCart size={20} />
          </Link>
        </div>

        {/* ── Left Image Area ────────────────────────────────────────────── */}
        <div
          className="w-full md:w-1/2 flex items-center justify-center overflow-hidden min-h-[45vh] md:min-h-[600px] relative"
          style={{ background: "var(--bg-elevated)" }}
        >
          {product.imageUrl ? (
            <img
              className="max-w-full max-h-full object-contain p-8 md:p-12 hover:scale-105 transition-transform duration-700 mix-blend-multiply drop-shadow-xl"
              src={product.imageUrl}
              alt={product.name}
            />
          ) : (
            <ImageIcon size={64} className="text-[color:var(--text-soft)] opacity-40" />
          )}
        </div>

        {/* ── Right Content Area ─────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col px-5 pt-8 pb-10 md:p-10 lg:p-12 z-10"
          style={{
            background: "var(--surface)",
            borderRadius: "32px 32px 0 0",
            marginTop: "-32px",
            boxShadow: "0 -8px 32px -8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Mobile Drag Handle */}
          <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-[color:var(--border-soft)] opacity-60" />

          {/* Desktop Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-soft)] hover:text-[color:var(--primary)] mb-6 transition-colors w-fit group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to List
          </button>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)] text-[color:var(--text-soft)]">
              {product.categoryName}
            </span>
            {isLowStock && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm" style={{ background: "var(--accent)", color: "#1a0c00" }}>
                Only {product.stockQuantity} left
              </span>
            )}
            {isOutOfStock && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm" style={{ background: "var(--danger)", color: "white" }}>
                Out of Stock
              </span>
            )}
          </div>

          {/* Title & Desc */}
          <h1 className="font-heading font-extrabold text-2xl md:text-4xl lg:text-5xl leading-[1.1] mb-4 text-[color:var(--text)]">
            {product.name}
          </h1>

          <div className="prose prose-sm md:prose-base prose-p:text-[color:var(--text-soft)] prose-p:leading-relaxed mb-8 max-w-none">
            {product.description ? (
               <p>{product.description}</p>
            ) : (
                <p className="italic opacity-60">No details provided for this product.</p>
            )}
          </div>

          {/* Bottom Action Area */}
          <div className="mt-auto">
            {/* Price & Add to Cart Block */}
            <div className="rounded-3xl p-5 md:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-[color:var(--surface)] border border-[color:var(--border-soft)] shadow-md relative overflow-hidden">
                {/* Decorative background blurs inside checkout block */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[color:var(--primary)]/5 rounded-full blur-2xl pointer-events-none"></div>

                <div>
                    <span className="text-[13px] font-bold text-[color:var(--text-soft)] uppercase tracking-widest mb-1 block">Total Price</span>
                    <span className="font-heading font-extrabold text-4xl text-[color:var(--text)]">
                    ₹{product.price.toFixed(0)}
                    </span>
                </div>

                {!isOutOfStock && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Stepper */}
                    <div className="flex justify-between items-center rounded-xl bg-[color:var(--bg-elevated)] border border-[color:var(--border-soft)] p-1 w-full sm:w-auto">
                        <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[color:var(--surface)] hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:shadow-none text-[color:var(--text)]"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        >
                        <Minus size={18} />
                        </button>
                        <span className="w-12 text-center font-bold text-base text-[color:var(--text)]">
                        {quantity}
                        </span>
                        <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[color:var(--surface)] hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:shadow-none text-[color:var(--text)]"
                        onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                        disabled={quantity >= product.stockQuantity}
                        >
                        <Plus size={18} />
                        </button>
                    </div>

                    <button
                        className="btn-primary h-[50px] px-8 text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_-6px_var(--primary)] w-full sm:w-auto whitespace-nowrap"
                        onClick={handleAddToCart}
                        disabled={adding}
                    >
                        {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} className="fill-white/20" />}
                        {adding ? "ADDING..." : "ADD TO CART"}
                    </button>
                    </div>
                )}

                {isOutOfStock && (
                    <button
                    disabled
                    className="h-[50px] px-8 rounded-xl font-bold tracking-wide uppercase text-sm bg-[color:var(--border-soft)]/50 text-[color:var(--text-soft)] cursor-not-allowed border border-[color:var(--border-soft)] w-full sm:w-auto"
                    >
                    Sold Out
                    </button>
                )}
            </div>

            {/* Feature Icons List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
                { icon: ShieldCheck, title: "1 Year Warranty", desc: "Official guarantee" },
                { icon: RefreshCw, title: "Easy Returns", desc: "10-day replacement" },
                { icon: Truck, title: "Express Delivery", desc: "Arrives in 8 minutes" },
            ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 p-4 rounded-2xl bg-[color:var(--surface-muted)] border border-[color:var(--border-soft)]">
                    <div className="w-10 h-10 rounded-full bg-[color:var(--surface)] text-[color:var(--primary)] flex items-center justify-center shadow-sm border border-[color:var(--border-soft)]">
                        <Icon size={18} />
                    </div>
                    <div>
                        <h4 className="text-[13px] font-bold text-[color:var(--text)]">{title}</h4>
                        <p className="text-[11px] text-[color:var(--text-soft)] font-medium">{desc}</p>
                    </div>
                </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
