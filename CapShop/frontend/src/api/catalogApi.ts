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

// ── Ratings ───────────────────────────────────────────────────────────────────

export interface ProductRatingDto {
  id: string;
  productId: string;
  userName: string;
  stars: number;
  reviewText?: string;
  createdAt: string;
}

export interface RatingAggregateDto {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export async function getProductRatings(
  productId: string,
  limit = 20,
): Promise<ProductRatingDto[]> {
  const res = await apiClient.get<ApiResponse<ProductRatingDto[]>>(
    `/catalog/products/${productId}/ratings`,
    { params: { limit } },
  );
  return res.data.data!;
}

export async function getRatingAggregate(
  productId: string,
): Promise<RatingAggregateDto> {
  const res = await apiClient.get<ApiResponse<RatingAggregateDto>>(
    `/catalog/products/${productId}/ratings/aggregate`,
  );
  return res.data.data!;
}

export async function submitRating(
  productId: string,
  stars: number,
  reviewText?: string,
): Promise<ProductRatingDto> {
  const res = await apiClient.post<ApiResponse<ProductRatingDto>>(
    `/catalog/products/${productId}/ratings`,
    { stars, reviewText },
  );
  return res.data.data!;
}
