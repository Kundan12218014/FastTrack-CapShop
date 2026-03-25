# Catalog Service Testing Documentation

This document outlines the testing strategy, unit test cases, and API testing guidelines for the `CapShop.CatalogService`.

## 1. Unit Testing Context

The unit tests for the Catalog Service are located in the `CapShop.CatalogService.Tests` project. We use **NUnit** as the testing framework and **Moq** for mocking dependencies (like `ICategoryRepository` and `IProductRepository`).

### Test Coverage

#### **GetProductsQueryHandlerTests**
Tests the functionality of fetching a paginated and filtered list of products.
- `Handle_WithValidQuery_ReturnsPagedResultOfProductDto`: Verifies that a properly populated filter request successfully calls the repository and maps the `Product` entities back to `ProductDto` inside a `PagedResult`.
- `Handle_WithPageSizeGreaterThanMax_ClampsPageSizeToMax`: Ensures that if a user requests a page size larger than the system maximum (e.g., 50), it safely clamps down to 50.
- `Handle_WithPageSizeLessThanMin_ClampsPageSizeToMin`: Ensures that if a user requests a page size less than 1, it safely clamps up to 1.

#### **GetProductByIdQueryHandlerTests**
Tests the retrieval of a single product's details using its unique identifier (`Guid`).
- `Handle_WithValidGuid_ReturnsProductDto`: Verifies that requesting a valid, existing `Guid` returns the correctly mapped `ProductDto`.
- `Handle_WithInvalidGuid_ThrowsNotFoundException`: Ensures that requesting a `Guid` that does not exist in the database throws a `NotFoundException`, which will explicitly map to a 404 response.

#### **GetFeaturedProductsQueryHandlerTests**
Tests the retrieval of featured products (typically for homepage displays).
- `Handle_WithValidCount_ReturnsMappedProductDtos`: Verifies that passing a requested count (e.g., 5 items) routes to the repository correctly and returns a matching list of mapped `ProductDto` items.

#### **GetCategoriesQueryHandlerTests**
Tests the fetching of all active product categories.
- `Handle_ValidRequest_ReturnsMappedCategoryDtos`: Checks that querying the categories correctly retrieves the dataset from the `ICategoryRepository` and accurately maps the data to an `IEnumerable<CategoryDto>`.

---

## 2. API Testing Guidelines

To effectively test the HTTP endpoints, run the `CapShop.CatalogService`. Development configuration includes **Swagger UI**, making it easy to test parameters manually.

Base Route: `GET http(s)://<host>:<port>`

### **Products Controller**

#### 1. Get Products (Search, Filter, Paginate)
* **Endpoint:** `GET /catalog/products`
* **Query Parameters:**
  * `query` (string, optional): Keyword search for name or description.
  * `categoryId` (int, optional): Filter by category.
  * `minPrice` (decimal, optional)
  * `maxPrice` (decimal, optional)
  * `sortBy` (string, default="name"): e.g., "name", "price_asc", "price_desc", "newest".
  * `page` (int, default=1)
  * `pageSize` (int, default=12)
* **Expected Response:** `200 OK` with a structured `ApiResponse<PagedResult<ProductDto>>`.

#### 2. Get Featured Products
* **Endpoint:** `GET /catalog/products/featured`
* **Query Parameters:**
  * `count` (int, default=8): Number of featured items to return.
* **Expected Response:** `200 OK` with `ApiResponse<IEnumerable<ProductDto>>`.

#### 3. Get Product By ID
* **Endpoint:** `GET /catalog/products/{id}`
* **Path Parameters:**
  * `id` (Guid, required): The unique identifier of the product.
* **Expected Responses:** 
  * `200 OK` with `ApiResponse<ProductDto>`.
  * `404 Not Found` if the GUID does not match an existing record.

---

### **Categories Controller**

#### 1. Get Active Categories
* **Endpoint:** `GET /catalog/categories`
* **Expected Response:** `200 OK` with an array of `CategoryDto` wrapped in an `ApiResponse`.

---

### Example cURL Requests

**Fetch a list of laptops under $1000:**
```bash
curl -X GET "https://localhost:5001/catalog/products?query=laptop&maxPrice=1000&sortBy=price_asc&page=1&pageSize=10" -H "accept: application/json"
```

**Fetch specific product details:**
```bash
curl -X GET "https://localhost:5001/catalog/products/123e4567-e89b-12d3-a456-426614174000" -H "accept: application/json"
```

**Fetch categories:**
```bash
curl -X GET "https://localhost:5001/catalog/categories" -H "accept: application/json"
```
