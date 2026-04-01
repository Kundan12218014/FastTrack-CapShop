import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getProducts,
  getCategories,
  type ProductDto,
  type CategoryDto,
} from "../../../api/catalogApi";

export const useProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const query = searchParams.get("query") ?? "";
  const categoryId = searchParams.get("categoryId")
    ? Number(searchParams.get("categoryId"))
    : undefined;
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const sortBy = searchParams.get("sortBy") ?? "name";
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set("page", "1");
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Load categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Load products on filter change
  useEffect(() => {
    setLoading(true);
    getProducts({
      query,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
      page,
      pageSize: 12,
    })
      .then((result) => {
        setProducts(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, categoryId, minPrice, maxPrice, sortBy, page]);

  return {
    products,
    categories,
    loading,
    totalCount,
    totalPages,
    query,
    categoryId,
    minPrice,
    maxPrice,
    sortBy,
    page,
    updateParam,
    clearFilters,
  };
};
