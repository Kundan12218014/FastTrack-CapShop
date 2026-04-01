import { useState, useEffect } from "react";
import {
  getMyOrders,
  getOrderById,
  cancelOrder,
  type OrderSummaryDto,
  type OrderDto,
} from "../../../api/orderApi";
import { showToast } from "../../../components/shared/Toast";

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders(page, 10);
      setOrders(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleCancel = async (
    orderId: string,
    reason = "Cancelled by customer",
  ) => {
    try {
      await cancelOrder(orderId, reason);
      showToast.success("Order cancelled successfully.");
      await fetchOrders();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Cannot cancel this order.";
      showToast.error(msg);
    }
  };

  return {
    orders,
    loading,
    page,
    totalPages,
    totalCount,
    setPage,
    handleCancel,
    refetch: fetchOrders,
  };
};

export const useOrderDetail = (orderId: string | undefined) => {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderById(orderId)
      .then(setOrder)
      .catch(() => showToast.error("Could not load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return { order, loading };
};
