import { useState, useEffect } from "react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  type CartDto,
} from "../../../api/orderApi";
import { useCartStore } from "../../../store/cartStore";
import { showToast } from "../../../components/shared/Toast";

export const useCart = () => {
  const { setCart: syncCartStore } = useCartStore();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
      syncCartStore(data);
    } catch {
      setCart(null);
      syncCartStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (
    itemId: string,
    newQty: number,
    availableStock: number,
  ) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(itemId, newQty, availableStock);
      await fetchCart();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not update quantity.";
      showToast.error(msg);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId);
      showToast.success("Item removed from cart.");
      await fetchCart();
    } catch {
      showToast.error("Could not remove item.");
    }
  };

  const gst = cart ? Math.round(cart.total * 0.18) : 0;
  const delivery = cart && cart.total > 499 ? 0 : 49;
  const grandTotal = cart ? cart.total + gst + delivery : 0;

  return {
    cart,
    loading,
    gst,
    delivery,
    grandTotal,
    handleUpdateQuantity,
    handleRemoveItem,
    refetch: fetchCart,
  };
};
