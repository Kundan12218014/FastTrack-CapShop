import { useState, useEffect } from "react";
import {
  getDashboardSummary,
  getAdminProducts,
  getAdminOrders,
  getSalesReport,
  getStatusSplit,
  updateOrderStatus,
  type DashboardSummaryDto,
  type AdminProductDto,
  type AdminOrderSummaryDto,
} from "../../../api/adminApi";
import { showToast } from "../../../components/shared/Toast";

// ── Dashboard ─────────────────────────────────────────────────────────────
export const useDashboard = () => {
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => showToast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

// ── Admin Products ────────────────────────────────────────────────────────
export const useAdminProducts = () => {
  const [products, setProducts] = useState<AdminProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getAdminProducts(search || undefined, page, 10);
      setProducts(res.items);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  return {
    products,
    loading,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    refetch: fetchProducts,
  };
};

// ── Admin Orders ──────────────────────────────────────────────────────────
export const useAdminOrders = () => {
  const [orders, setOrders] = useState<AdminOrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders(
        search || undefined,
        status || undefined,
        page,
        10,
      );
      setOrders(res.items);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, page]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast.success(`Order updated to ${newStatus}`);
      await fetchOrders();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not update order status.";
      showToast.error(msg);
    }
  };

  return {
    orders,
    loading,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    totalPages,
    handleStatusUpdate,
    refetch: fetchOrders,
  };
};

// ── Reports ───────────────────────────────────────────────────────────────
export const useReports = () => {
  const today = new Date().toISOString().split("T")[0];
  const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(month);
  const [to, setTo] = useState(today);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [statusSplit, setStatusSplit] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sales, split] = await Promise.all([
        getSalesReport(from, to),
        getStatusSplit(),
      ]);
      setSalesReport(sales);
      setStatusSplit(split);
    } catch {
      showToast.error("Could not load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    from,
    setFrom,
    to,
    setTo,
    salesReport,
    statusSplit,
    loading,
    fetchReports,
  };
};
