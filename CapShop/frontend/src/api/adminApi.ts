import apiClient from "./axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface AdminProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  imageUrl?: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderSummaryDto {
  id: string;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  placedAt: string;
  itemCount: number;
}

export interface DashboardSummaryDto {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  revenueToday: number;
  ordersToday: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    totalAmount: number;
    status: string;
    placedAt: string;
  }[];
}

export interface AdminPagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const res = await apiClient.get<ApiResponse<DashboardSummaryDto>>(
    "/admin/dashboard/summary",
  );
  return res.data.data!;
}

export async function getAdminProducts(
  search?: string,
  includeInactive = true,
  page = 1,
  pageSize = 20,
): Promise<AdminPagedResult<AdminProductDto>> {
  const res = await apiClient.get<
    ApiResponse<AdminPagedResult<AdminProductDto>>
  >("/admin/products", { params: { search, includeInactive, page, pageSize } });
  return res.data.data!;
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl?: string;
  isActive: boolean;
}): Promise<void> {
  await apiClient.post("/admin/products", data);
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description: string;
    price: number;
    categoryId: number;
    imageUrl?: string;
  },
): Promise<void> {
  await apiClient.put(`/admin/products/${id}`, data);
}

export async function updateProductStock(
  id: string,
  quantity: number,
): Promise<void> {
  await apiClient.put(`/admin/products/${id}/stock`, { quantity });
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/status`, { isActive });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/products/${id}`);
}

export async function getAdminOrders(
  search?: string,
  status?: string,
  page = 1,
  pageSize = 20,
): Promise<AdminPagedResult<AdminOrderSummaryDto>> {
  const res = await apiClient.get<
    ApiResponse<AdminPagedResult<AdminOrderSummaryDto>>
  >("/admin/orders", { params: { search, status, page, pageSize } });
  return res.data.data!;
}

export async function updateOrderStatus(
  id: string,
  newStatus: string,
  remarks?: string,
): Promise<void> {
  await apiClient.put(`/admin/orders/${id}/status`, { newStatus, remarks });
}

export async function getSalesReport(from: string, to: string): Promise<any> {
  const res = await apiClient.get<ApiResponse<any>>("/admin/reports/sales", {
    params: { from, to },
  });
  return res.data.data!;
}

export async function getStatusSplit(): Promise<any> {
  const res = await apiClient.get<ApiResponse<any>>(
    "/admin/reports/status-split",
  );
  return res.data.data!;
}

export async function downloadSalesCsv(from: string, to: string): Promise<void> {
  const res = await apiClient.get("/admin/reports/sales/export/csv", {
    params: { from, to },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sales_report_${from}_to_${to}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadSalesPdf(from: string, to: string): Promise<void> {
  const res = await apiClient.get("/admin/reports/sales/export/pdf", {
    params: { from, to },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sales_report_${from}_to_${to}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
