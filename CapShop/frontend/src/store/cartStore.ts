import { create } from "zustand";

/**
 * Client-side cart count store.
 * The actual cart data lives in the backend (Order Service).
 * This store just holds the item count for the Navbar badge
 * so we don't need to refetch the full cart on every page.
 *
 * Updated after:
 *  - addToCart API call succeeds
 *  - removeCartItem API call succeeds
 *  - getCart API call completes (sync from server)
 */
interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
  reset: () => set({ itemCount: 0 }),
}));
