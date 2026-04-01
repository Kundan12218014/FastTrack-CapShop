/**
 * Centralised route path constants.
 * Never hardcode route strings in components — always import from here.
 * If a route changes, update it once here and every link/navigate call updates automatically.
 */
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",

  // Customer (protected by CustomerGuard)
  CUSTOMER: {
    HOME: "/customer/home",
    PRODUCTS: "/customer/products",
    PRODUCT_DETAIL: "/customer/products/:id",
    CART: "/customer/cart",
    CHECKOUT: "/customer/checkout",
    ORDERS: "/customer/orders",
    ORDER_DETAIL: "/customer/orders/:id",
    ORDER_CONFIRM: "/customer/order-confirmation/:id",
  },

  // Admin (protected by AdminGuard)
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    PRODUCTS: "/admin/products",
    ORDERS: "/admin/orders",
    REPORTS: "/admin/reports",
  },
} as const;

/** Helper: build a concrete route path from a parameterised template */
export const buildRoute = (template: string, params: Record<string, string>) =>
  Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    template,
  );
