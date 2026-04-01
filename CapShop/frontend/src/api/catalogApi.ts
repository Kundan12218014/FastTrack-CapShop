import apiClient from "./axiosClient";
import type { ApiResponse } from "../types/auth.types";

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  stockStatus: "InStock" | "LowStock" | "OutOfStock";
  imageUrl?: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function getProducts(params: {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<ProductDto>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ProductDto>>>(
    "/catalog/products",
    { params },
  );
  return res.data.data!;
}

export async function getProductById(id: string): Promise<ProductDto> {
  const res = await apiClient.get<ApiResponse<ProductDto>>(
    `/catalog/products/${id}`,
  );
  return res.data.data!;
}

export async function getFeaturedProducts(count = 8): Promise<ProductDto[]> {
  const res = await apiClient.get<ApiResponse<ProductDto[]>>(
    "/catalog/products/featured",
    { params: { count } },
  );
  return res.data.data!;
}

export async function getCategories(): Promise<CategoryDto[]> {
  const res = await apiClient.get<ApiResponse<CategoryDto[]>>(
    "/catalog/categories",
  );
  return res.data.data!;
}
