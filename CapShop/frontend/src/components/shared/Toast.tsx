/**
 * Toast wrapper — re-exports react-hot-toast's toast function
 * with pre-configured styles matching the CapShop design system.
 *
 * Usage:
 *   import { showToast } from "../components/shared/Toast";
 *   showToast.success("Item added to cart!");
 *   showToast.error("Something went wrong.");
 *   showToast.info("Processing your order...");
 */
import toast from "react-hot-toast";

export const showToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        color: "#166534",
      },
      iconTheme: { primary: "#16A34A", secondary: "#F0FDF4" },
    }),

  error: (message: string) =>
    toast.error(message, {
      style: {
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#991B1B",
      },
      iconTheme: { primary: "#DC2626", secondary: "#FEF2F2" },
    }),

  info: (message: string) =>
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        color: "#1E40AF",
      },
    }),

  loading: (message: string) =>
    toast.loading(message, {
      style: {
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
      },
    }),
};