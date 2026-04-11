import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ROUTES } from "../constants/routes";
import { CustomerGuard } from "../guards/CustomerGuard";
import { AdminGuard }    from "../guards/AdminGuard";
import { CustomerLayout } from "../layouts/CustomerLayout";
import { AdminLayout }    from "../layouts/AdminLayout";

// Auth
import { AuthPage } from "../features/auth/pages/AuthPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";

// Customer pages
import { HomePage }             from "../features/catalog/pages/HomePage";
import { ProductListingPage }   from "../features/catalog/pages/ProductListingPage";
import { ProductDetailPage }    from "../features/catalog/pages/ProductDetailPage";
import { CartPage }             from "../features/cart/pages/CartPage";
import { CheckoutPage }         from "../features/checkout/pages/CheckoutPage";
import { OrderHistoryPage }     from "../features/orders/pages/OrderHistoryPage";
import { OrderDetailPage }      from "../features/orders/pages/OrderDetailPage";
import { OrderConfirmationPage } from "../features/orders/pages/OrderConfirmationPage";
import { SecurityPage }         from "../features/account/pages/SecurityPage";

// Admin pages
import { AdminDashboard }    from "../features/admin/pages/AdminDashboard";
import { AdminProductsPage } from "../features/admin/pages/AdminProductsPage";
import { AdminOrdersPage }   from "../features/admin/pages/AdminOrdersPage";
import { AdminReportsPage }  from "../features/admin/pages/AdminReportsPage";

export const AppRouter = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        },
      }}
    />
    <Routes>

      {/* Root */}
      <Route path="/" element={<Navigate to={ROUTES.CUSTOMER.HOME} replace />} />

      {/* Auth (both login + signup use same AuthPage component) */}
      <Route path="/auth/login"  element={<AuthPage />} />
      <Route path="/auth/signup" element={<AuthPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      {/* Customer routes */}
      <Route element={<CustomerLayout />}>
        {/* Public customer browsing */}
        <Route path={ROUTES.CUSTOMER.HOME}           element={<HomePage />} />
        <Route path={ROUTES.CUSTOMER.PRODUCTS}       element={<ProductListingPage />} />
        <Route path={ROUTES.CUSTOMER.PRODUCT_DETAIL} element={<ProductDetailPage />} />

        {/* Protected customer actions */}
        <Route element={<CustomerGuard />}>
          <Route path={ROUTES.CUSTOMER.CART}             element={<CartPage />} />
          <Route path={ROUTES.CUSTOMER.CHECKOUT}         element={<CheckoutPage />} />
          <Route path={ROUTES.CUSTOMER.ORDERS}           element={<OrderHistoryPage />} />
          <Route path={ROUTES.CUSTOMER.ORDER_DETAIL}     element={<OrderDetailPage />} />
          <Route path={ROUTES.CUSTOMER.ORDER_CONFIRM} element={<OrderConfirmationPage />} />
          <Route path={ROUTES.CUSTOMER.SECURITY}         element={<SecurityPage />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN.PRODUCTS}  element={<AdminProductsPage />} />
          <Route path={ROUTES.ADMIN.ORDERS}    element={<AdminOrdersPage />} />
          <Route path={ROUTES.ADMIN.REPORTS}   element={<AdminReportsPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="font-display text-6xl font-bold text-primary">404</h1>
          <p className="text-gray-500">Page not found</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      } />

    </Routes>
  </BrowserRouter>
);