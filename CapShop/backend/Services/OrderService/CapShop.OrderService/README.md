# CapShop OrderService

## Overview
OrderService handles cart checkout and order lifecycle. It also publishes integration events used by downstream services.

## What Was Added
This service was updated to carry customer email through order placement and publish it in the final order event.

### Email Propagation Flow
1. `OrdersController` reads user email from JWT claims (`ClaimTypes.Email` or `email`).
2. `PlaceOrderCommand` now includes `CustomerEmail`.
3. `Order` entity stores `CustomerEmail`.
4. Saga completion publishes `OrderPlacedIntegrationEvent` with `CustomerEmail`.

## Files Changed
- `Contollers/OrdersController.cs`
- `Application/Commands/OrderCommands.cs`
- `Domain/Entities/Order.cs`
- `Infrastructure/Persistence/OrderDbContext.cs`
- `Application/Services/SagaConsumers.cs`
- Migration: `Migrations/20260413160621_AddCustomerEmailToOrders.cs`

## Contract Dependency
`OrderPlacedIntegrationEvent` is defined in shared contracts and now includes:
- `OrderId`
- `OrderNumber`
- `UserId`
- `CustomerEmail`
- `TotalAmount`
- `PaymentMethod`
- `ItemCount`
- `PlacedAtUtc`

## Database
A migration adds a required `CustomerEmail` column in `orders.Orders`.

Apply migration:

```powershell
dotnet ef database update --project backend/Services/OrderService/CapShop.OrderService/CapShop.OrderService.csproj --startup-project backend/Services/OrderService/CapShop.OrderService/CapShop.OrderService.csproj
```

## Notes
- If the token does not include an email claim, order placement will fail with unauthorized access.
- This design avoids extra calls to AuthService during saga processing.
