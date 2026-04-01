/**
 * cartSlice.ts — re-exports the cart store for feature-local imports.
 *
 * The actual store is defined in src/store/cartStore.ts.
 * This file exists so features/cart can import from their own directory
 * without breaking the folder structure convention.
 */
export { useCartStore } from "../../../store/cartStore";
