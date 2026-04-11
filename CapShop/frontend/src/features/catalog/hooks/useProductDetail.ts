import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductById, type ProductDto } from "../../../api/catalogApi";
import { addToCart } from "../../../api/orderApi";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";
import { ROUTES } from "../../../constants/routes";
import { showToast } from "../../../components/shared/Toast";

export const useProductDetail = (productId: string | undefined) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProductById(productId)
      .then(setProduct)
      .catch(() => navigate(ROUTES.CUSTOMER.PRODUCTS))
      .finally(() => setLoading(false));
  }, [productId]);

  const incrementQty = () =>
    setQuantity((q) => Math.min(q + 1, product?.stockQuantity ?? 1));

  const decrementQty = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!product) return;

    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        availableStock: product.stockQuantity,
      });
      await fetchCart();
      showToast.success(`${quantity} item(s) added to cart!`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not add to cart.";
      showToast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  return {
    product,
    loading,
    quantity,
    adding,
    incrementQty,
    decrementQty,
    handleAddToCart,
  };
};
