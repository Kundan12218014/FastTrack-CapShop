# CapShop AI Chatbot — Architecture & Developer Guide

> Powered by Ollama (`llama3.2:1b`) + RAG (FastAPI) + a client-side state machine

---

## Overview

The CapShop AI Assistant is a full-featured, Amazon Rufus-style chatbot embedded in the React frontend. It combines:

- **Client-side intent classification** — no LLM round-trip for common actions
- **State machine** — every interaction moves through well-defined states
- **Live data** — queries the real Catalog and Order APIs, not just the LLM
- **Rich UI messages** — product cards, order timelines, compare tables, star ratings, confirm dialogs
- **Streaming LLM answers** — Server-Sent Events from Ollama via FastAPI
- **Conversation memory** — remembers last shown products/orders for follow-up commands

---

## Architecture

```
User types message
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Intent Classifier  (intentClassifier.ts)                   │
│  Regex + keyword patterns — runs in <1ms, no network call   │
│                                                             │
│  PRODUCT_SEARCH │ ORDER_TRACK │ ADD_TO_CART │ COMPARE       │
│  RATE_PRODUCT   │ CANCEL_ORDER│ CART_VIEW   │ GENERAL_QA    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  State Machine  (chatStateMachine.ts)                       │
│                                                             │
│  IDLE → CLASSIFYING → SEARCHING_PRODUCTS → SHOWING_PRODUCTS │
│                    → FETCHING_ORDERS     → SHOWING_ORDERS   │
│                    → ADDING_TO_CART      → CART_UPDATED     │
│                    → COMPARING                              │
│                    → AWAITING_RATING                        │
│                    → CONFIRMING_CANCEL                      │
│                    → STREAMING_ANSWER    → IDLE             │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  useChat hook  (hooks/useChat.ts)                           │
│  Orchestrates: API calls, state transitions, message adds   │
└─────────────────────────────────────────────────────────────┘
        │
        ├── Catalog API  → getProducts(), submitRating()
        ├── Order API    → getMyOrders(), cancelOrder(), addToCart()
        └── AI API       → askAiStream() (SSE from FastAPI/Ollama)
```

---

## File Structure

```
frontend/src/features/chat/
├── engine/
│   ├── intentClassifier.ts     # Regex-based intent detection
│   └── chatStateMachine.ts     # State enum, transitions, mode labels
├── store/
│   └── chatStore.ts            # Zustand store with full message type system
├── hooks/
│   └── useChat.ts              # Main orchestration hook
├── components/
│   ├── ChatWidget.tsx          # Floating FAB + panel container
│   ├── ChatPanel.tsx           # Header + message list + input
│   ├── ChatHeader.tsx          # Title, mode badge, online status
│   ├── ChatInput.tsx           # Textarea + context-aware quick prompts
│   ├── ChatMessage.tsx         # Dispatcher → renders correct component per type
│   ├── ChatProductCard.tsx     # Compact product card with Add to Cart
│   ├── ChatProductGrid.tsx     # Horizontal scroll grid of product cards
│   ├── ChatOrderTimeline.tsx   # Order list with progress stepper
│   ├── ChatCompareTable.tsx    # Side-by-side product comparison
│   ├── ChatRatingWidget.tsx    # 5-star input + review textarea
│   ├── ChatStarRating.tsx      # Reusable star rating (interactive/readonly)
│   ├── ChatActionChips.tsx     # Contextual suggestion chips
│   └── ChatConfirmDialog.tsx   # Confirm/cancel dialog for destructive actions
└── index.ts                    # Barrel exports

backend/Services/ollama_rag_app/
├── rag_core.py                 # RAG logic + CapShop system prompt + streaming
└── fastapi_app.py              # FastAPI endpoints including SSE stream

backend/Services/CatalogService/
├── Domain/Entities/ProductRating.cs
├── Domain/Interfaces/ICatalogInterfaces.cs  (IProductRatingRepository added)
├── Application/Commands/SubmitRatingCommand.cs
├── Application/Queries/GetProductRatingsQuery.cs
├── Infrastructure/Persistence/Repositories/ProductRatingRepository.cs
├── Controllers/RatingsController.cs
└── Infrastructure/Persistence/CatalogDbContext.cs  (ProductRatings DbSet added)
```

---

## Intent Classification

The classifier runs **entirely client-side** using regex patterns. No LLM call is made for recognized intents.

| Intent             | Example Triggers                               | Action                                           |
| ------------------ | ---------------------------------------------- | ------------------------------------------------ |
| `PRODUCT_SEARCH`   | "show me laptops under 50000", "find books"    | Calls `getProducts()` → renders product cards    |
| `ORDER_TRACK`      | "where is my order", "track shipment"          | Calls `getMyOrders()` → renders order timeline   |
| `ADD_TO_CART`      | "add the first one to cart", "buy this"        | Calls `addToCart()` → shows cart updated message |
| `COMPARE_PRODUCTS` | "compare iPhone vs Samsung", "which is better" | Renders compare table from last shown products   |
| `RATE_PRODUCT`     | "rate this product", "leave a review"          | Renders star rating widget                       |
| `CANCEL_ORDER`     | "cancel my order", "I want to cancel"          | Shows confirm dialog                             |
| `CART_VIEW`        | "show my cart", "what's in my cart"            | Navigates to cart page                           |
| `GENERAL_QA`       | Everything else                                | Streams answer from Ollama                       |

### Adding a new intent

1. Add the intent type to `ChatIntent` in `intentClassifier.ts`
2. Add regex patterns to the pattern table
3. Add a `case` in `useChat.ts` `sendMessage` switch
4. Add the state to `ChatState` in `chatStateMachine.ts`
5. Add a message type to `MessageType` in `chatStore.ts` if needed
6. Add a renderer in `ChatMessage.tsx`

---

## State Machine

States drive what the UI renders and what quick prompts appear in the input bar.

```
IDLE
  Quick prompts: "Show me laptops", "Track my order", "Top mobiles", "Browse books"

SEARCHING_PRODUCTS / FETCHING_ORDERS
  Shows: skeleton card placeholders (3 animated cards)

SHOWING_PRODUCTS  →  mode = "shopping"
  Quick prompts: "Compare top 2", "Add first to cart", "Show more", "Rate this product"

SHOWING_ORDERS  →  mode = "support"
  Quick prompts: "Cancel latest order", "Show all orders", "Track shipment"

STREAMING_ANSWER  →  mode = "general"
  Shows: typing dots → streaming tokens with cursor
```

---

## Message Types

Every assistant message has a `type` field that drives which component renders:

| Type             | Component           | Description                                     |
| ---------------- | ------------------- | ----------------------------------------------- |
| `text`           | Inline text         | Plain text with markdown bold, streaming cursor |
| `product_cards`  | `ChatProductGrid`   | Horizontal scroll of `ChatProductCard`          |
| `order_timeline` | `ChatOrderTimeline` | Order list with progress stepper                |
| `compare_table`  | `ChatCompareTable`  | Side-by-side product comparison                 |
| `rating_widget`  | `ChatRatingWidget`  | 5-star input + optional review                  |
| `action_chips`   | `ChatActionChips`   | Contextual suggestion buttons                   |
| `confirm_dialog` | `ChatConfirmDialog` | Confirm/cancel for destructive actions          |
| `cart_updated`   | Inline success      | Green confirmation with cart icon               |

---

## Conversation Memory

The store tracks context between messages so follow-up commands work naturally:

| Field                    | What it stores              | Used by                                           |
| ------------------------ | --------------------------- | ------------------------------------------------- |
| `lastShownProducts`      | Last product search results | "Add the first one", "Compare top 2", "Rate this" |
| `lastShownOrders`        | Last order fetch results    | "Cancel my latest order"                          |
| `pendingCancelOrderId`   | Order awaiting cancellation | `ChatConfirmDialog`                               |
| `pendingRatingProductId` | Product awaiting rating     | `ChatRatingWidget`                                |

---

## Ratings Backend

### New endpoint: `POST /catalog/products/{id}/ratings`

Requires JWT authentication. One rating per user per product (enforced by unique DB index).

```http
POST /catalog/products/3fa85f64-5717-4562-b3fc-2c963f66afa6/ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "stars": 4,
  "reviewText": "Great product, fast delivery!"
}
```

### `GET /catalog/products/{id}/ratings/aggregate`

Returns average rating and star distribution. Public endpoint.

```json
{
  "success": true,
  "data": {
    "average": 4.2,
    "count": 127,
    "distribution": { "1": 3, "2": 5, "3": 12, "4": 48, "5": 59 }
  }
}
```

### EF Core migration

The `ProductRatings` table is created automatically when the CatalogService starts (auto-migration in Development/Docker). To run manually:

```bash
dotnet ef database update --project backend/Services/CatalogService/CapShop.CatalogService
```

---

## RAG System Prompt

The Ollama model is primed with a CapShop-specific system context on every request (`rag_core.py: CAPSHOP_SYSTEM_CONTEXT`). It knows:

- All order statuses and their meanings
- Product categories available
- Cancellation rules (Paid/PaymentPending/Packed only)
- Authentication flows (JWT, 2FA)
- Pricing is in Indian Rupees (₹)

When documents are uploaded to the RAG index, their content is injected as additional context before the conversation history.

---

## Streaming (SSE)

The `/api/ask/stream` endpoint uses Server-Sent Events:

```
event: sources
data: [{"filename":"...","chunk_no":1,"text":"...","score":0.82}]

data: Hello
data: , I
data: can
data: help
data: [DONE]
```

The frontend `chatApi.ts` parses this stream, calling:

- `onSources(sources)` — before any tokens arrive
- `onToken(token)` — for each text token
- `onDone()` — when `[DONE]` is received
- `onError(message)` — if `[ERROR]` is received

---

## Running Locally

```bash
# Start Ollama (separate terminal)
ollama serve
ollama pull llama3.2:1b

# Start the RAG service
cd backend/Services/ollama_rag_app
.venv\Scripts\uvicorn fastapi_app:app --host 127.0.0.1 --port 8001 --reload

# Or use the dev script (starts everything)
.\dev-start.ps1
```

The chatbot is available at `http://localhost:5173` — click the bot icon in the bottom-right corner.

---

## Extending the Chatbot

### Add a new rich message type

1. Add to `MessageType` union in `chatStore.ts`
2. Add fields to `ChatMessageEntry` interface
3. Add an `addXxxMessage()` action to the store
4. Create `ChatXxx.tsx` component
5. Add a `case "xxx":` in `ChatMessage.tsx` dispatcher
6. Call the store action from `useChat.ts`

### Change the LLM model

```bash
# Pull a different model
ollama pull llama3.2:3b

# Set via environment variable
OLLAMA_MODEL=llama3.2:3b uvicorn fastapi_app:app ...
```

### Upload documents to the RAG index

```bash
curl -X POST http://localhost:8001/api/upload \
  -F "file=@your-document.txt"
```

The document will be chunked, indexed, and used as context for relevant questions.
