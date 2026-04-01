import apiClient from "./axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartDto {
  id: string;
  status: string;
  items: CartItemDto[];
  total: number;
  itemCount: number;
}

export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  placedAt: string;
  itemCount: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  placedAt: string;
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    phoneNumber: string;
  };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getCart(): Promise<CartDto> {
  const res = await apiClient.get<ApiResponse<CartDto>>("/orders/cart");
  return res.data.data!;
}

export async function addToCart(data: {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}): Promise<CartItemDto> {
  const res = await apiClient.post<ApiResponse<CartItemDto>>(
    "/orders/cart/items",
    data,
  );
  return res.data.data!;
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  availableStock: number,
): Promise<void> {
  await apiClient.put(`/orders/cart/items/${itemId}`, {
    quantity,
    availableStock,
  });
}

export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`/orders/cart/items/${itemId}`);
}

export async function simulatePayment(
  paymentMethod: string,
): Promise<{
  isSuccess: boolean;
  transactionId: string;
  failureReason?: string;
  message: string;
}> {
  const res = await apiClient.post<ApiResponse<any>>(
    "/orders/payment/simulate",
    { paymentMethod },
  );
  return res.data.data!;
}

export async function placeOrder(data: {
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    phoneNumber: string;
  };
  paymentMethod: string;
  transactionId: string;
}): Promise<OrderDto> {
  const res = await apiClient.post<ApiResponse<OrderDto>>(
    "/orders/place",
    data,
  );
  return res.data.data!;
}

export async function getMyOrders(
  page = 1,
  pageSize = 10,
): Promise<PagedResult<OrderSummaryDto>> {
  const res = await apiClient.get<ApiResponse<PagedResult<OrderSummaryDto>>>(
    "/orders/my",
    { params: { page, pageSize } },
  );
  return res.data.data!;
}

export async function getOrderById(id: string): Promise<OrderDto> {
  const res = await apiClient.get<ApiResponse<OrderDto>>(`/orders/${id}`);
  return res.data.data!;
}

export async function cancelOrder(id: string, reason: string): Promise<void> {
  await apiClient.post(`/orders/${id}/cancel`, { reason });
}
