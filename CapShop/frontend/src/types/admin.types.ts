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
  recentOrders: RecentOrderDto[];
}

export interface RecentOrderDto {
  id: string;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  placedAt: string;
}

export interface AdminPagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
}

export interface SalesReportDto {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyBreakdown: DailySalesDto[];
}

export interface DailySalesDto {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatusSplitReportDto {
  totalOrders: number;
  statusBreakdown: StatusCountDto[];
}

export interface StatusCountDto {
  status: string;
  count: number;
  percentage: number;
}
