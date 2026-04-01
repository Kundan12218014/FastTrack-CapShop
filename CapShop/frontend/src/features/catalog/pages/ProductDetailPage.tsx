import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, Zap, ArrowLeft, Package } from "lucide-react";
import { getProductById, type ProductDto } from "../../../api/catalogApi";
import { addToCart } from "../../../api/orderApi";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Loader } from "../../../components/shared/Loader";
import { ROUTES } from "../../../constants/routes";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";

export const ProductDetailPage = () => {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [product,  setProduct]  = useState<ProductDto | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [qty,      setQty]      = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(id)
      .then(setProduct)
      .catch(() => navigate(ROUTES.CUSTOMER.PRODUCTS))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate(ROUTES.LOGIN); return; }
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart({
        productId:      product.id,
        productName:    product.name,
        unitPrice:      product.price,
        quantity:       qty,
        availableStock: product.stockQuantity,
      });
      toast.success(`${qty} item(s) added to cart!`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Could not add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate(ROUTES.CUSTOMER.CART);
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><Loader /></div>;
  if (!product) return null;

  const outOfStock = product.stockStatus === "OutOfStock";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to products
      </button>

      {/* ── Main Section (Wf04) ───────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">

        {/* Product Images (Carousel placeholder + zoom) */}
        <div className="card p-4">
          <p className="text-xs text-gray-400 font-medium mb-3">Product Images • Carousel + zoom</p>
          <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name}
                className="w-full h-full object-contain" />
            ) : (
              <Package size={80} className="text-gray-300" />
            )}
          </div>
          {/* Thumbnail strip */}
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map(i => (
              <div key={i}
                className="w-14 h-14 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <Package size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="card p-6 flex flex-col">
          <p className="text-sm text-primary font-medium mb-1">{product.categoryName}</p>

          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-4">
            <span className="font-display text-3xl font-bold text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-gray-400 line-through ml-2">
              ₹{Math.round(product.price * 1.2).toLocaleString("en-IN")}
            </span>
            <span className="text-success text-sm font-medium ml-2">20% off</span>
          </div>

          {/* Rating placeholder */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={i <= 4 ? "text-yellow-400" : "text-gray-300"}>★</span>
              ))}
            </div>
            <span className="text-sm text-gray-500">4.2 (124 reviews)</span>
          </div>

          {/* Stock */}
          <div className="mb-4">
            <StatusBadge status={product.stockStatus} />
            {product.stockStatus === "LowStock" && (
              <span className="text-xs text-warning ml-2">Only {product.stockQuantity} left!</span>
            )}
          </div>

          {/* Offers */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-green-700 mb-1">Available Offers</p>
            <p className="text-xs text-green-600">• 5% cashback on first purchase</p>
            <p className="text-xs text-green-600">• Free delivery on orders above ₹499</p>
          </div>

          {/* Qty selector */}
          {!outOfStock && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors"
                >−</button>
                <span className="px-4 py-2 font-semibold text-center min-w-[40px]">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors"
                >+</button>
              </div>
              <span className="text-xs text-gray-400">{product.stockQuantity} available</span>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || addingToCart}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              {outOfStock ? "Out of Stock" : addingToCart ? "Adding…" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || addingToCart}
              className="btn-accent flex-1 flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Description + Specs Tabs (Wf04) ─────────────────────── */}
      <div className="card p-6">
        <div className="flex gap-4 border-b border-gray-200 mb-5">
          {(["description", "specs"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-semibold capitalize transition-colors
                ${activeTab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
          <button className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600">
            Reviews (optional)
          </button>
        </div>

        {activeTab === "description" ? (
          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description || "No description available for this product."}
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {[
              ["Category",     product.categoryName],
              ["Stock",        `${product.stockQuantity} units`],
              ["SKU",          product.id.slice(0, 8).toUpperCase()],
              ["Status",       product.isActive ? "Active" : "Inactive"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700 w-28">{label}</span>
                <span className="text-gray-500">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};