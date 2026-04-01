/**
 * All API endpoint paths — single source of truth.
 * The base URL (gateway) is set in axiosClient.ts via VITE_GATEWAY_URL.
 */
export const API = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    USER: (id: string) => `/auth/users/${id}`,
    ACTIVATE: (id: string) => `/auth/users/${id}/activate`,
  },

  CATALOG: {
    PRODUCTS: "/catalog/products",
    PRODUCT: (id: string) => `/catalog/products/${id}`,
    FEATURED: "/catalog/products/featured",
    CATEGORIES: "/catalog/categories",
  },

  ORDERS: {
    CART: "/orders/cart",
    CART_ITEMS: "/orders/cart/items",
    CART_ITEM: (id: string) => `/orders/cart/items/${id}`,
    PAYMENT_SIMULATE: "/orders/payment/simulate",
    PLACE: "/orders/place",
    MY_ORDERS: "/orders/my",
    ORDER: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard/summary",
    PRODUCTS: "/admin/products",
    PRODUCT: (id: string) => `/admin/products/${id}`,
    PRODUCT_STOCK: (id: string) => `/admin/products/${id}/stock`,
    PRODUCT_STATUS: (id: string) => `/admin/products/${id}/status`,
    ORDERS: "/admin/orders",
    ORDER_STATUS: (id: string) => `/admin/orders/${id}/status`,
    REPORTS_SALES: "/admin/reports/sales",
    REPORTS_STATUS: "/admin/reports/status-split",
    EXPORT_SALES_CSV: "/admin/reports/sales/export/csv",
    EXPORT_SALES_PDF: "/admin/reports/sales/export/pdf",
    EXPORT_STATUS_CSV: "/admin/reports/status-split/export/csv",
  },
} as const;
