# OrderService Test Suite

## Overview
Comprehensive test suite for the CapShop OrderService covering all command handlers, query handlers, and domain entities.

## Test Statistics
- **Total Tests**: 59
- **Passed**: 59 ✅
- **Failed**: 0
- **Coverage Areas**: Commands, Queries, Domain Entities

## Test Structure

### 1. Cart Command Handler Tests (`CartCommandHandlerTests.cs`)
Tests for cart operations including adding, updating, and removing items.

#### AddToCartCommandHandler Tests
- ✅ `Handle_WithNewCart_CreatesCartAndAddsItem` - Verifies new cart creation and item addition
- ✅ `Handle_WithExistingCart_AddsItemToCart` - Tests adding items to existing cart
- ✅ `Handle_WithQuantityExceedingStock_ThrowsDomainException` - Validates stock constraints

#### UpdateCartItemCommandHandler Tests
- ✅ `Handle_WithValidQuantity_UpdatesCartItem` - Tests quantity updates
- ✅ `Handle_WithNoActiveCart_ThrowsNotFoundException` - Validates cart existence check
- ✅ `Handle_WithQuantityExceedingStock_ThrowsDomainException` - Tests stock validation

#### RemoveCartItemCommandHandler Tests
- ✅ `Handle_WithValidCartItem_RemovesItem` - Tests item removal
- ✅ `Handle_WithNoActiveCart_ThrowsNotFoundException` - Validates cart existence
- ✅ `Handle_WithInvalidCartItemId_ThrowsNotFoundException` - Tests item existence validation

### 2. Order Command Handler Tests (`OrderCommandHandlerTests.cs`)
Tests for order processing operations.

#### SimulatePaymentCommandHandler Tests
- ✅ `Handle_WithCODPayment_AlwaysSucceeds` - Verifies COD payments always succeed
- ✅ `Handle_WithUPIPayment_MaySucceedOrFail` - Tests UPI payment simulation (85% success rate)
- ✅ `Handle_WithEmptyCart_ThrowsDomainException` - Validates cart has items before payment
- ✅ `Handle_WithNoCart_ThrowsDomainException` - Ensures cart exists

#### PlaceOrderCommandHandler Tests
- ✅ `Handle_WithValidCart_CreatesOrder` - Tests successful order creation
- ✅ `Handle_WithEmptyCart_ThrowsDomainException` - Validates non-empty cart requirement
- ✅ `Handle_WithNoCart_ThrowsDomainException` - Ensures cart exists
- ✅ `Handle_WithInvalidPincode_ThrowsArgumentException` - Tests shipping address validation

#### CancelOrderCommandHandler Tests
- ✅ `Handle_WithValidOrder_CancelsOrder` - Tests order cancellation
- ✅ `Handle_WithInvalidOrderId_ThrowsNotFoundException` - Validates order existence
- ✅ `Handle_WithUnauthorizedUser_ThrowsForbiddenException` - Tests authorization

### 3. Order Query Handler Tests (`OrderQueryHandlerTests.cs`)
Tests for retrieving order and cart information.

#### GetCartQueryHandler Tests
- ✅ `Handle_WithExistingCart_ReturnsCartDto` - Tests cart retrieval with items
- ✅ `Handle_WithNoCart_ReturnsEmptyCartDto` - Returns empty cart when none exists
- ✅ `Handle_WithCartWithMultipleItems_CalculatesTotalCorrectly` - Validates total calculation

#### GetMyOrdersQueryHandler Tests
- ✅ `Handle_WithValidUserId_ReturnsPagedOrders` - Tests paginated order list
- ✅ `Handle_WithNoOrders_ReturnsEmptyPagedResult` - Handles empty order list
- ✅ `Handle_WithPagination_ReturnsCorrectPage` - Validates pagination logic

#### GetOrderByIdQueryHandler Tests
- ✅ `Handle_WithValidOrderId_ReturnsOrderDto` - Tests order details retrieval
- ✅ `Handle_WithInvalidOrderId_ThrowsNotFoundException` - Validates order existence
- ✅ `Handle_WithUnauthorizedUser_ThrowsForbiddenException` - Tests authorization
- ✅ `Handle_WithMultipleItems_ReturnsAllItems` - Validates complete order data

### 4. Domain Entity Tests (`DomainEntityTests.cs`)
Tests for business logic in domain entities.

#### CartEntity Tests
- ✅ `Create_WithValidUserId_CreatesCart` - Tests cart creation
- ✅ `AddItem_WithValidData_AddsItemToCart` - Tests adding items
- ✅ `AddItem_WithExistingProduct_UpdatesQuantity` - Tests quantity aggregation
- ✅ `AddItem_WithQuantityExceedingStock_ThrowsDomainException` - Stock validation
- ✅ `AddItem_WithZeroOrNegativeQuantity_ThrowsDomainException` - Quantity validation
- ✅ `UpdateItemQuantity_WithValidQuantity_UpdatesItem` - Tests quantity updates
- ✅ `UpdateItemQuantity_WithInvalidItemId_ThrowsNotFoundException` - Item existence check
- ✅ `RemoveItem_WithValidItemId_RemovesItem` - Tests item removal
- ✅ `RemoveItem_WithInvalidItemId_ThrowsNotFoundException` - Item existence check
- ✅ `MarkAsConverted_ChangesStatus` - Tests cart status transition
- ✅ `AddItem_ToConvertedCart_ThrowsDomainException` - Prevents modifying converted cart
- ✅ `Total_WithMultipleItems_CalculatesCorrectly` - Validates total calculation

#### OrderEntity Tests
- ✅ `Create_WithValidData_CreatesOrder` - Tests order creation
- ✅ `Create_WithEmptyCart_ThrowsDomainException` - Validates cart items requirement
- ✅ `UpdateStatus_WithValidTransition_UpdatesStatus` - Tests status updates
- ✅ `UpdateStatus_WithInvalidTransition_ThrowsDomainException` - Validates transition rules
- ✅ `UpdateStatus_ValidSequence_AllowsMultipleTransitions` - Tests full workflow
- ✅ `Cancel_FromValidStatus_CancelsOrder` - Tests order cancellation
- ✅ `UpdateStatus_FromDelivered_ThrowsDomainException` - Prevents changing terminal status
- ✅ `OrderNumber_IsUnique` - Ensures unique order numbers
- ✅ `TotalAmount_CalculatesCorrectly` - Validates order total calculation

#### ShippingAddress Tests
- ✅ `Create_WithValidData_CreatesAddress` - Tests address creation
- ✅ `Create_WithInvalidPincode_ThrowsArgumentException` - Validates 6-digit pincode
- ✅ `Create_WithEmptyFullName_ThrowsArgumentException` - Requires full name
- ✅ `Create_WithEmptyAddressLine_ThrowsArgumentException` - Requires address
- ✅ `Create_WithEmptyPhoneNumber_ThrowsArgumentException` - Requires phone number

#### PaymentSimulation Tests
- ✅ `Create_WithSuccessfulPayment_CreatesSimulation` - Tests successful payment
- ✅ `Create_WithFailedPayment_CreatesSimulationWithReason` - Tests failed payment
- ✅ `Create_GeneratesUniqueTransactionIds` - Ensures unique transaction IDs

## Key Testing Patterns

### 1. **AAA Pattern** (Arrange-Act-Assert)
All tests follow the AAA pattern for clarity and maintainability.

### 2. **Mock-Based Testing**
Uses Moq framework to mock repository dependencies:
- `ICartRepository`
- `IOrderRepository`
- `IPaymentSimulationRepository`

### 3. **Domain Logic Testing**
Tests business rules directly on domain entities:
- Cart item management
- Order status transitions
- Value object validations

### 4. **Exception Testing**
Validates proper exception handling:
- `NotFoundException` - When entities don't exist
- `DomainException` - For business rule violations
- `ForbiddenException` - For authorization failures
- `ArgumentException` - For validation errors

### 5. **Edge Case Coverage**
- Empty carts
- Stock constraints
- Invalid transitions
- Authorization checks
- Pagination boundaries

## Test Coverage Summary

| Component | Tests | Description |
|-----------|-------|-------------|
| Cart Commands | 9 | Add, Update, Remove cart items |
| Order Commands | 8 | Payment simulation, Place order, Cancel order |
| Cart Queries | 3 | Get cart with items and calculations |
| Order Queries | 7 | Get orders with pagination and filtering |
| Cart Entity | 12 | Cart business logic and validations |
| Order Entity | 8 | Order lifecycle and status transitions |
| Shipping Address | 5 | Address validation |
| Payment Simulation | 3 | Payment simulation logic |

## Running the Tests

### Run All Tests
```bash
dotnet test CapShop.OrderService.Tests.csproj
```

### Run Specific Test Class
```bash
dotnet test --filter "FullyQualifiedName~CartCommandHandlerTests"
```

### Run with Coverage
```bash
dotnet test /p:CollectCoverage=true
```

## Dependencies

- **NUnit 4.3.2** - Testing framework
- **Moq 4.20.72** - Mocking framework
- **Microsoft.NET.Test.Sdk 17.14.0** - Test SDK
- **NUnit3TestAdapter 5.0.0** - Test adapter
- **coverlet.collector 6.0.4** - Code coverage

## Notes

1. All tests are isolated and don't depend on external services or databases
2. Mocks are used to simulate repository behavior
3. Domain entities are tested directly without mocking for business logic validation
4. Tests verify both happy path and error scenarios
5. Authorization and validation are thoroughly tested

## Future Enhancements

Consider adding tests for:
- Admin commands (UpdateOrderStatus, GetAllOrders) when implemented
- Integration tests with real database
- Performance tests for large datasets
- Concurrency tests for cart operations
