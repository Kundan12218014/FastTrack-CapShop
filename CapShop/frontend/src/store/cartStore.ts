import { create } from "zustand";
import { getCart, type CartDto } from "../api/orderApi";

interface CartState {
  cart: CartDto | null;
  itemCount: number;
  isSyncing: boolean;
  setCart: (cart: CartDto | null) => void;
  fetchCart: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  itemCount: 0,
  isSyncing: false,
  setCart: (cart) => set({ cart, itemCount: cart?.itemCount || 0 }),
  fetchCart: async () => {
    set({ isSyncing: true });
    try {
      const c = await getCart();
      set({ cart: c, itemCount: c.itemCount });
    } catch {
      // If unauthorized or fails, keep it silent or handle generically
    } finally {
      set({ isSyncing: false });
    }
  },
  reset: () => set({ cart: null, itemCount: 0, isSyncing: false }),
}));
