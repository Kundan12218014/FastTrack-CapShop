# CapShop API Documentation

## Overview

CapShop is a microservices-based e-commerce backend exposed through an API Gateway.
For demos and interviews, the easiest entry point is the Swagger UI served by the gateway.

- Gateway Swagger UI: `http://localhost:5000/swagger`
- Deployed Swagger UI: `http://40.80.89.63:5000/swagger`
- Frontend Admin Panel: `http://40.80.89.63:8080`

Important:

- Swagger is served by the `gateway` on port `5000`
- The admin/frontend UI is served separately on port `8080`

The gateway aggregates Swagger/OpenAPI definitions from the core services:

- Auth Service
- Catalog Service
- Order Service
- Admin Service
- Notification Service

## Architecture Snapshot

The system is split into independent services behind the gateway:

- `Auth Service`
  Handles signup, login, 2FA, password reset, and user addresses.
- `Catalog Service`
  Serves products and categories for storefront browsing.
- `Order Service`
  Handles cart, checkout, payment simulation, and customer order history.
- `Admin Service`
  Handles admin dashboard, product management, order management, and reports.
- `Notification Service`
  Stores and serves user notifications.
- `Gateway`
  Central entry point that performs JWT validation and forwards requests to services.

## Swagger Showcase URLs

Use the gateway Swagger UI for the interview:

- UI: `http://40.80.89.63:5000/swagger`

Swagger JSON documents proxied by the gateway:

- Gateway JSON: `/swagger/gateway/swagger.json`
- Auth JSON: `/gateway/swagger/auth/swagger.json`
- Catalog JSON: `/gateway/swagger/catalog/swagger.json`
- Orders JSON: `/gateway/swagger/orders/swagger.json`
- Admin JSON: `/gateway/swagger/admin/swagger.json`
- Notifications JSON: `/gateway/swagger/notifications/swagger.json`

## Authentication In Swagger

Protected endpoints require a JWT bearer token.

### Step 1: Login

Use:

- `POST /auth/login`

If the account has two-factor authentication enabled, the login response can require a second verification step:

- `POST /auth/verify-two-factor`

### Step 2: Authorize In Swagger

If Swagger shows the `Authorize` button:

1. Copy the JWT token from the login response.
2. Click `Authorize`.
3. Enter:

```text
Bearer <your-jwt-token>
```

### Role-based access

- Public routes: catalog browsing, signup, login, forgot/reset password
- Authenticated user routes: cart, orders, addresses, notifications
- Admin routes: dashboard, admin products, admin orders, admin reports

## Common Response Shape

Most endpoints return a common wrapper:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Paged endpoints usually return pagination metadata inside `data`.

## API Modules

### 1. Auth Service

Base route: `/auth`

Key endpoints:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/verify-two-factor`
- `POST /auth/enable-two-factor`
- `POST /auth/disable-two-factor`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/users/{id}`
- `PATCH /auth/users/{id}/activate`

### 2. Address Management

Base route: `/auth/addresses`

Key endpoints:

- `GET /auth/addresses`
- `POST /auth/addresses`
- `PUT /auth/addresses/{id}`
- `DELETE /auth/addresses/{id}`

### 3. Catalog Service

Base routes:

- `/catalog/products`
- `/catalog/categories`

Key endpoints:

- `GET /catalog/products`
- `GET /catalog/products/featured`
- `GET /catalog/products/{id}`
- `GET /catalog/categories`

Useful query parameters for products:

- `query`
- `categoryId`
- `minPrice`
- `maxPrice`
- `sortBy`
- `page`
- `pageSize`

### 4. Cart Service

Base route: `/orders/cart`

Key endpoints:

- `GET /orders/cart`
- `POST /orders/cart/items`
- `PUT /orders/cart/items/{itemId}`
- `DELETE /orders/cart/items/{itemId}`

### 5. Order Service

Base route: `/orders`

Key endpoints:

- `POST /orders/payment/simulate`
- `POST /orders/place`
- `GET /orders/my`
- `GET /orders/{id}`
- `POST /orders/{id}/cancel`

Notes:

- Online payments can be simulated for demo purposes.
- Order creation includes shipping address and payment method.

### 6. Notification Service

Base route: `/notifications`

Key endpoints:

- `GET /notifications`
- `POST /notifications/{id}/read`

### 7. Admin Dashboard

Base route: `/admin/dashboard`

Key endpoint:

- `GET /admin/dashboard/summary`

### 8. Admin Product Management

Base route: `/admin/products`

Key endpoints:

- `GET /admin/products`
- `GET /admin/products/{id}`
- `POST /admin/products`
- `PUT /admin/products/{id}`
- `PUT /admin/products/{id}/stock`
- `PATCH /admin/products/{id}/status`
- `DELETE /admin/products/{id}`

### 9. Admin Order Management

Base route: `/admin/orders`

Key endpoints:

- `GET /admin/orders`
- `GET /admin/orders/{id}`
- `PUT /admin/orders/{id}/status`

Typical admin order flow:

- Review placed orders
- Inspect order details
- Update fulfillment status:
  `Paid -> Packed -> Shipped -> Delivered`

### 10. Admin Reports

Base route: `/admin/reports`

Key endpoints:

- `GET /admin/reports/sales`
- `GET /admin/reports/status-split`
- `GET /admin/reports/sales/export/csv`
- `GET /admin/reports/sales/export/pdf`

## Suggested Interview Demo Flow

If you want a clean showcase in Swagger, this sequence works well:

1. Open gateway Swagger.
2. Show public product browsing:
   `GET /catalog/categories`
   `GET /catalog/products`
3. Show auth flow:
   `POST /auth/signup` or `POST /auth/login`
4. Use the JWT token in `Authorize`.
5. Show customer actions:
   `GET /orders/cart`
   `POST /orders/cart/items`
   `POST /orders/place`
   `GET /orders/my`
6. Show admin actions with an admin token:
   `GET /admin/dashboard/summary`
   `GET /admin/products`
   `GET /admin/orders`
   `GET /admin/reports/sales`

## Talking Points For Interview

- API-first microservices architecture with a centralized gateway
- JWT authentication enforced at the gateway and service layers
- Swagger aggregation for multi-service discoverability
- Admin and customer APIs separated by role and responsibility
- Reporting, notifications, and order workflow exposed through clean REST endpoints

## Notes

- The frontend runs separately from the gateway, but the backend demo is best shown through the gateway Swagger UI.
- Some protected endpoints need a valid user token, and admin endpoints need an admin role token.
- For the most reliable demo, start from the gateway Swagger UI instead of individual service Swagger pages.
