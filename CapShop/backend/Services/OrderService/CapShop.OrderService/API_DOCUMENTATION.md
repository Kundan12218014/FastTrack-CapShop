# CapShop Order Service API Documentation

## Overview
The Order Service manages shopping carts and order processing. All endpoints require an authenticated user with a valid JWT token. The User ID is extracted directly from the authorization token claims, so it is not required in the URL or request body.

**Base Path:** `/orders`
**Authentication:** Bearer Token (JWT) required.

---

## 🛒 Cart Management APIs

Base route: `/x `

### 1. Get Active Cart
Retrieves the current active shopping cart for the authenticated user.

* **URL**: `/`
* **Method**: `GET`
* **Responses**:
    * `200 OK`: Returns the cart details, including items and total calculation.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "Active",
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcba1",
        "productName": "Wireless Headphones",
        "unitPrice": 99.99,
        "quantity": 2,
        "lineTotal": 199.98
      }
    ],
    "total": 199.98,
    "itemCount": 2
  }
}
```

### 2. Add Item to Cart
Adds a new product to the cart or increments the quantity if the product is already in the cart.

* **URL**: `/items`
* **Method**: `POST`
* **Request Body**:
```json
{
  "productId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcba1",
  "productName": "Wireless Headphones",
  "unitPrice": 99.99,
  "quantity": 1,
  "availableStock": 50
}
```
* **Responses**:
    * `201 Created`: Successfully added to cart.
    * `400 Bad Request`: Validation errors or insufficient stock.

### 3. Update Cart Item Quantity
Updates the quantity of a specific item in the cart.

* **URL**: `/items/{itemId}`
* **Method**: `PUT`
* **URL Params**: `itemId=[guid]` (The ID of the Cart Item, *not* the Product ID)
* **Request Body**:
```json
{
  "quantity": 3,
  "availableStock": 50
}
```
* **Responses**:
    * `204 No Content`: Quantity updated successfully.
    * `400 Bad Request`: Validation errors or insufficient stock.
    * `404 Not Found`: Cart item not found.

### 4. Remove Item from Cart
Deletes an item from the cart.

* **URL**: `/items/{itemId}`
* **Method**: `DELETE`
* **URL Params**: `itemId=[guid]`
* **Responses**:
    * `204 No Content`: Item removed successfully.
    * `404 Not Found`: Cart item not found.

---

## 📦 Order Processing APIs

Base route: `/orders`

### 1. Simulate Payment
Simulates a payment processing transaction before placing the order.

* **URL**: `/payment/simulate`
* **Method**: `POST`
* **Request Body**:
```json
{
  "paymentMethod": "UPI" // Valid values: "COD", "UPI", "Card"
}
```
* **Responses**:
    * `200 OK`: Returns the simulated payment result processing (success/failure) and transaction ID.
    * `400 Bad Request`: Cart is empty or no active cart found.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "isSuccess": true,
    "transactionId": "TXN-A1B2C3D4E5",
    "failureReason": null,
    "message": "Payment successful. Proceed to place your order."
  }
}
```

### 2. Place Order
Converts the active cart into a placed order. Requires a successful transaction identifier.

* **URL**: `/place`
* **Method**: `POST`
* **Request Body**:
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "addressLine": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phoneNumber": "9876543210"
  },
  "paymentMethod": "UPI",
  "transactionId": "TXN-A1B2C3D4E5"
}
```
* **Responses**:
    * `201 Created`: Order successfully placed. Returns full order details.
    * `400 Bad Request`: Invalid address (e.g., pincode format), or cart is empty.

### 3. Get My Orders
Retrieves a paginated list of orders placed by the currently authenticated user.

* **URL**: `/my`
* **Method**: `GET`
* **Query Params**: 
    * `page` (optional, default: 1)
    * `pageSize` (optional, default: 10)
* **Responses**:
    * `200 OK`: Returns paginated order summaries.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1fa85f64-5717-4562-b3fc-2c963f66af22",
        "orderNumber": "ORD-20260325-1A2B3C",
        "totalAmount": 199.98,
        "status": "Paid",
        "placedAt": "2026-03-25T10:00:00Z",
        "itemCount": 2
      }
    ],
    "totalCount": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4. Get Order Details
Retrieves the complete details of a specific order. Users can only fetch their own orders.

* **URL**: `/{id}`
* **Method**: `GET`
* **URL Params**: `id=[guid]` (The Order ID)
* **Responses**:
    * `200 OK`: Returns full order object (including items, address, and status).
    * `403 Forbidden`: Attempted to access an order belonging to another user.
    * `404 Not Found`: Order not found.

### 5. Cancel Order
Cancels an existing order. Certain terminal statuses (like 'Delivered') cannot be cancelled.

* **URL**: `/{id}/cancel`
* **Method**: `POST`
* **URL Params**: `id=[guid]`
* **Request Body**:
```json
{
  "reason": "Changed my mind"
}
```
* **Responses**:
    * `204 No Content`: Order successfully cancelled.
    * `400 Bad Request`: Invalid status transition (e.g. order already delivered).
    * `403 Forbidden`: Authenticated user does not own the target order.
    * `404 Not Found`: Order not found.
