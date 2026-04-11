# CapShop System Architecture Documentation

This document outlines the detailed system architecture, diagrams, and low-level designs for CapShop, a distributed e-commerce application based on microservices.

## 1. High-Level Design (HLD)
The system is built on a microservices architecture to ensure high scalability, independent deployments, and separation of concerns.

- **Frontend**: A React application (built with Vite) that communicates with the backend via the API Gateway.
- **Gateway**: A centralized entry point (acting as an API Gateway / Reverse Proxy) routing frontend HTTP requests to respective microservices.
- **Microservices**:
  - **AuthService**: Handles user authentication, authorization, registration, and JWT token issuance.
  - **CatalogService**: Manages the product catalog, categories, inventory, and search.
  - **OrderService**: Handles shopping cart management, order placement, and payment simulation.
  - **AdminService**: Admin portal logic, dashboards, and background processes watching across domains.
- **Message Broker**: **RabbitMQ** is used for asynchronous/event-driven communication (e.g., `OrderPlacedIntegrationEvent`).
- **Caching**: **Redis** is natively used for fast ephemeral storage (like user sessions or temporary carts/MFA tokens).
- **Database**: **MSSQL Server** serves as the persistent database for the microservices.

### HLD Context Diagram (Mermaid)
```mermaid
flowchart TD
    User([End User / Admin]) -->|HTTPS| Frontend(React / Vite Frontend)
    Frontend -->|API Requests| Gateway(API Gateway)
    
    Gateway -->|Auth Routes| AuthService[Auth Service]
    Gateway -->|Catalog Routes| CatalogService[Catalog Service]
    Gateway -->|Order Routes| OrderService[Order Service]
    Gateway -->|Admin Routes| AdminService[Admin Service]

    subgraph Communication & State
        RabbitMQ([RabbitMQ Broker])
        Redis[(Redis Cache)]
    end

    subgraph Data Layer
        DB[(MSSQL Server Database)]
    end
    
    AuthService --> DB
    CatalogService --> DB
    OrderService --> DB
    AdminService --> DB
    CatalogService -.->|Caches Data| Redis
    OrderService -.->|Caches Cart/Session| Redis
    
    OrderService -->|Orders Placed Event| RabbitMQ
    AdminService -.->|Consumes Events| RabbitMQ
```

---

## 2. Component Diagram
This diagram shows the structural relationships between the various deployable units and the tech stack components.

```mermaid
componentDiagram
    package "CapShop Client" {
        [React + Vite Frontend]
    }
    
    package "CapShop Backend (Docker Network)" {
        [API Gateway (Ocelot/YARP)]
        
        node "Auth Component" {
            [CapShop.AuthService]
        }
        
        node "Catalog Component" {
            [CapShop.CatalogService]
        }
        
        node "Order Component" {
            [CapShop.OrderService]
        }
        
        node "Admin Component" {
            [CapShop.AdminService]
        }
        
        node "Infrastructure Components" {
            [RabbitMQ Event Bus]
            [Redis Cache Engine]
        }
        
        database "MSSQL Server" {
            [Auth Schema]
            [Catalog Schema]
            [Order Schema]
            [Admin Schema]
        }
    }
    
    [React + Vite Frontend] ..> [API Gateway (Ocelot/YARP)] : HTTP/REST
    [API Gateway (Ocelot/YARP)] ..> [CapShop.AuthService]
    [API Gateway (Ocelot/YARP)] ..> [CapShop.CatalogService]
    [API Gateway (Ocelot/YARP)] ..> [CapShop.OrderService]
    [API Gateway (Ocelot/YARP)] ..> [CapShop.AdminService]
    
    [CapShop.AuthService] --> [Auth Schema]
    [CapShop.CatalogService] --> [Catalog Schema]
    [CapShop.OrderService] --> [Order Schema]
    [CapShop.AdminService] --> [Admin Schema]
    
    [CapShop.OrderService] ..> [RabbitMQ Event Bus] : Publishes
    [CapShop.AdminService] ..> [RabbitMQ Event Bus] : Subscribes
    
    [CapShop.CatalogService] ..> [Redis Cache Engine]
    [CapShop.OrderService] ..> [Redis Cache Engine]
```

---

## 3. Deployment Diagram
Illustrating how the containers are hosted via Docker Compose.

```mermaid
architecture-beta
    group docker_host(server)[Docker Host Machine]

    service fw(internet)[Firewall / Entry]
    
    service fe(server)[capshop-frontend :8080] in docker_host
    service gw(server)[capshop-gateway :5000] in docker_host
    
    service auth(server)[capshop-auth-service] in docker_host
    service cat(server)[capshop-catalog-service] in docker_host
    service ord(server)[capshop-order-service] in docker_host
    service adm(server)[capshop-admin-service] in docker_host

    service mq(server)[capshop-rabbitmq :5672] in docker_host
    service redis(server)[capshop-redis :6379] in docker_host
    service sql(database)[capshop-sqlserver :1433] in docker_host

    fw:R --> L:fe
    fe:R --> L:gw
    
    gw:R --> L:auth
    gw:R --> L:cat
    gw:R --> L:ord
    gw:R --> L:adm
    
    ord:B --> T:mq
    adm:B --> T:mq
    
    cat:B --> T:redis
    ord:B --> T:redis
    
    auth:B --> T:sql
    cat:B --> T:sql
    ord:B --> T:sql
    adm:B --> T:sql
```

---

## 4. State Machine Diagram (Order Lifecycle)
This state diagram models the dynamic behavior of the core `Order` entity throughout its payment and fulfillment lifecycle.

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer checks out
    
    Pending --> Paid : Payment Simulator Approves
    Pending --> Cancelled : Payment Simulation Fails
    Pending --> Cancelled : Customer Cancels
    
    Paid --> Shipped : Admin dispatches order
    Paid --> Cancelled : Admin cancels (Refunded)
    
    Shipped --> Delivered : Customer receives package
    
    Cancelled --> [*]
    Delivered --> [*]
```

---

## 5. Activity Diagram (Checkout Flow)
This diagram maps out the branching logic required to determine whether an order can be successfully placed.

```mermaid
flowchart TD
    Start([User clicks Checkout]) --> ValUser{Is User Logged In?}
    
    ValUser -->|No| PromptLogin(Redirect to Auth/Login)
    PromptLogin --> Start
    
    ValUser -->|Yes| ValCart{Is Cart Empty?}
    
    ValCart -->|Yes| ErrCart(Show Error: Cart Empty)
    ErrCart --> End([End Flow])
    
    ValCart -->|No| FetchStock(API Call: Validate Stock & Price in CatalogService)
    FetchStock --> CheckStock{Are All Items in Stock?}
    
    CheckStock -->|No| ErrStock(Show Error: Insufficient Inventory for Item X)
    ErrStock --> End
    
    CheckStock -->|Yes| PlaceOrder(Create Order Record in OrderService)
    PlaceOrder --> DBUpdate[(Save to MSSQL)]
    DBUpdate --> PubEvent(Publish OrderPlacedEvent to RabbitMQ)
    PubEvent --> ClearCart(Wipe User's Redis Cart)
    ClearCart --> Success(Redirect to Success Page)
    Success --> End
```

---

## 6. Use Case Diagram
The following diagram captures the interactions between the primary actors (Customer, Admin) and the CapShop system.

```mermaid
usecaseDiagram
    actor Customer as "Customer"
    actor Admin as "Administrator"
    
    package CapShop System {
        usecase "Browse Products" as UC1
        usecase "Search Catalog" as UC2
        usecase "Manage Shopping Cart" as UC3
        usecase "Place Order" as UC4
        usecase "View Order History" as UC5
        usecase "Manage Inventory" as UC6
        usecase "View Dashboards" as UC7
        usecase "Login / Register" as UC8
        usecase "Manage Users" as UC9
    }
    
    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC8
    
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC1
```

---

## 7. Entity-Relationship (ER) Diagram
The internal databases follow standard Relational constructs holding the E-Commerce domain.

```mermaid
erDiagram
    USER {
        uniqueidentifier Id PK
        string FullName
        string Email
        string PasswordHash
        string Role
        datetime CreatedAt
    }
    
    CATEGORY {
        uniqueidentifier Id PK
        string Name
        string Description
    }
    
    PRODUCT {
        uniqueidentifier Id PK
        uniqueidentifier CategoryId FK
        string Title
        string Description
        decimal Price
        int StockLevel
    }
    
    ORDER {
        uniqueidentifier Id PK
        uniqueidentifier UserId FK
        decimal TotalAmount
        string OrderStatus
        datetime OrderDate
    }
    
    ORDER_ITEM {
        uniqueidentifier Id PK
        uniqueidentifier OrderId FK
        uniqueidentifier ProductId FK
        int Quantity
        decimal UnitPrice
    }
    
    CART {
        uniqueidentifier Id PK
        uniqueidentifier UserId FK
        datetime LastUpdated
    }
    
    CART_ITEM {
        uniqueidentifier Id PK
        uniqueidentifier CartId FK
        uniqueidentifier ProductId FK
        int Quantity
    }

    PAYMENT_SIMULATION {
        uniqueidentifier Id PK
        uniqueidentifier OrderId FK
        string PaymentStatus
        datetime ProcessedAt
    }

    USER ||--o{ ORDER : "places"
    USER ||--o| CART : "owns"
    CATEGORY ||--o{ PRODUCT : "contains"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "is sold as"
    CART ||--o{ CART_ITEM : "contains"
    PRODUCT ||--o{ CART_ITEM : "is added to"
    ORDER ||--o| PAYMENT_SIMULATION : "is paid via"
```

---

## 8. Data Flow Diagram (DFD)

### Level 0 (Context Diagram)
```mermaid
flowchart TD
    Customer(Customer) -->|Browse/Buy/Checkout| System(CapShop Microservices System)
    Admin(Administrator) -->|Manage Products/Check Orders| System
    System -.->|Emails/Notifications| EmailProvider(External SMTP/Provider)
    System -.->|Payment Processing| PaymentGateway(Stripe/External Provider)
```

### Level 1 DFD
```mermaid
flowchart TD
    User(User Application)
    
    System_Gateway(API Gateway Level)
    
    P1(Authentication Process)
    P2(Product Browsing/Search)
    P3(Cart Management)
    P4(Checkout Process)
    P5(Admin Operations)

    DB_User[(User Data)]
    DB_Cat[(Catalog DB)]
    DB_Orders[(Order/Cart DB)]
    Broker([RabbitMQ Broker])

    User <-->|Requests & Responses| System_Gateway
    
    System_Gateway <-->|Login, Registers| P1
    System_Gateway <-->|Queries| P2
    System_Gateway <-->|Modifies| P3
    System_Gateway <-->|Submits Order| P4
    System_Gateway <-->|Authorized Admin Cmds| P5

    P1 <--> DB_User
    P2 <--> DB_Cat
    P3 <--> DB_Orders
    P4 --> DB_Orders
    P4 -->|Enqueues Payload| Broker
    
    Broker -->|Reads Events| P5
    P5 <--> DB_Cat
    P5 <--> DB_Orders
```

---

## 9. Class Diagram (Domain Model Example)
This class diagram focuses on the domain relationships used in the Order Service backing the transaction.

```mermaid
classDiagram
    class BaseEntity {
        +Guid Id
        +DateTime CreatedAt
        +DateTime UpdatedAt
    }

    class Order {
        +Guid UserId
        +OrderStatus Status
        +decimal TotalAmount
        +DateTime PlacedAt
        +ICollection~OrderItem~ OrderItems
        +CalculateTotal() decimal
        +MarkAsPaid() void
        +CancelOrder() void
    }

    class OrderItem {
        +Guid OrderId
        +Guid ProductId
        +int Quantity
        +decimal UnitPrice
        +ProductName string
        +GetSubtotal() decimal
    }

    class Cart {
        +Guid UserId
        +ICollection~CartItem~ Items
        +decimal GrandTotal
        +AddItem(productId, quantity) void
        +RemoveItem(productId) void
        +ClearCart() void
    }

    class CartItem {
        +Guid CartId
        +Guid ProductId
        +int Quantity
    }

    class OrderStatus {
        <<enumeration>>
        Pending
        Paid
        Shipped
        Delivered
        Cancelled
    }

    BaseEntity <|-- Order
    BaseEntity <|-- OrderItem
    BaseEntity <|-- Cart
    BaseEntity <|-- CartItem

    Order "1" *-- "many" OrderItem : contains
    Order --> OrderStatus : sets
    Cart "1" *-- "many" CartItem : manages
```

---

## 10. Sequence Diagrams

### 10.1 Authentication Loop
```mermaid
sequenceDiagram
    participant UI as Frontend Client
    participant GW as API Gateway
    participant Auth as AuthService
    participant DB as SQL Server

    UI->>GW: POST /auth/login (email, pwd)
    GW->>Auth: Forward Login
    Auth->>DB: Fetch User Hash
    DB-->>Auth: Salted Hash
    Auth->>Auth: Verify password match
    Auth->>Auth: Build JWT Token with Roles
    Auth-->>GW: Respons (JWT)
    GW-->>UI: 200 OK + JWT
```

### 10.2 Order Placement Flow (Event Driven)
```mermaid
sequenceDiagram
    participant UI as Frontend Client
    participant GW as API Gateway
    participant Cart as OrderService (Cart)
    participant Catalog as CatalogService
    participant MQ as RabbitMQ
    participant Admin as AdminService

    UI->>GW: POST /api/orders/checkout
    GW->>Cart: Forward Checkout
    Cart->>Catalog: Validate Product Inventory
    Catalog-->>Cart: Stock Valid
    Cart->>Cart: Create Order via SQL
    Cart->>MQ: Publish `OrderPlacedIntegrationEvent`
    Cart-->>GW: Respond 201 Created (Order Details)
    GW-->>UI: Navigate to Confirmation Page
    
    %% Asynchronous flow running parallel
    MQ-->>Admin: Pushes `OrderPlacedIntegrationEvent`
    Admin->>Admin: Consumes Event & Updates Admin Dashboard metrics
```

---

## 11. Detailed Service Diagrams

### 11.1 AuthService Detail
```mermaid
flowchart TD
    API(Auth API Gateway Proxy)
    
    subgraph AuthService[Auth Service Internal]
        C(Controllers: AuthController, UsersController)
        S(Services: TokenService, EmailService, IdentityService)
        R(Repositories: UserRepository)
        C --> S
        S --> R
    end
    
    API --> C
    R --> DB[(SQL Server - Auth DB)]
    S -.->|Send Emails| SMTP([SMTP Relay])
```

### 11.2 CatalogService Detail
```mermaid
flowchart TD
    API(Catalog API Gateway Proxy)
    
    subgraph CatalogService[Catalog Service Internal]
        C(Controllers: ProductsController, CategoriesController)
        S(Services: ProductCatalogService)
        R(Repositories: ProductRepository, CategoryRepository)
        Cache(Cache Manager: Redis Interceptor)
        
        C --> S
        S --> Cache
        S --> R
    end
    
    API --> C
    R --> DB[(SQL Server - Catalog DB)]
    Cache -.-> Redis[(Redis Cache)]
```

### 11.3 OrderService Detail
```mermaid
flowchart TD
    API(Order API Gateway Proxy)
    
    subgraph OrderService[Order Service Internal]
        C(Controllers: OrderController, CartController)
        S(Services: CartService, OrderProcessingService)
        R(Repositories: OrderRepository, CartRepository)
        P(Publisher: RabbitMqMessagePublisher)
        
        C --> S
        S --> R
        S --> P
    end
    
    API --> C
    R --> DB[(SQL Server - Order DB)]
    P -.->|OrderPlacedIntegrationEvent| MQ([RabbitMQ])
    S -.->|Inter-Service HTTP| Catalog([CatalogService API])
```

### 11.4 AdminService Detail
```mermaid
flowchart TD
    API(Admin API Gateway Proxy)
    
    subgraph AdminService[Admin Service Internal]
        C(Controllers: AdminDashboardController, ConfigController)
        Cons(Consumers: OrderPlacedConsumer)
        S(Services: DashboardMetricsService)
        R(Repositories: AdminMetricsRepository)
        
        C --> S
        Cons --> S
        S --> R
    end
    
    API --> C
    R --> DB[(SQL Server - Admin DB)]
    MQ([RabbitMQ]) -.->|Reads Events| Cons
```
