import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  askAiStream,
  checkAiHealth,
  type StreamCallbacks,
} from "../../../api/chatApi";
import {
  getProducts,
  getCategories,
  submitRating,
  type ProductDto,
} from "../../../api/catalogApi";
import { getMyOrders, cancelOrder, addToCart } from "../../../api/orderApi";
import { useCartStore } from "../../../store/cartStore";
import { useAuthStore } from "../../../store/authStore";
import { useChatStore, type ActionChip } from "../store/chatStore";
import {
  classifyIntent,
  extractPriceRange,
  extractCategory,
} from "../engine/intentClassifier";
import { ROUTES, buildRoute } from "../../../constants/routes";
import { showToast } from "../../../components/shared/Toast";

// Module-level category cache — fetched once per session
let cachedCategories: { id: number; name: string }[] = [];
let categoryFetchPromise: Promise<void> | null = null;

// Pre-fetch immediately on module load so cache is warm before first message
function startCategoryFetch() {
  if (cachedCategories.length > 0 || categoryFetchPromise) return;
  categoryFetchPromise = getCategories()
    .then((cats) => {
      cachedCategories = cats;
    })
    .catch(() => {})
    .finally(() => {
      categoryFetchPromise = null;
    });
}
startCategoryFetch();

async function resolveCategoryId(name: string): Promise<number | undefined> {
  // Ensure cache is populated — await any in-progress fetch
  if (cachedCategories.length === 0) {
    if (!categoryFetchPromise) {
      categoryFetchPromise = getCategories()
        .then((cats) => {
          cachedCategories = cats;
        })
        .catch(() => {})
        .finally(() => {
          categoryFetchPromise = null;
        });
    }
    await categoryFetchPromise;
  }
  const lower = name.toLowerCase();
  return cachedCategories.find((c) => c.name.toLowerCase() === lower)?.id;
}

function priceLabel(min?: number, max?: number): string {
  if (min && max)
    return `between Rs.${min.toLocaleString("en-IN")} and Rs.${max.toLocaleString("en-IN")}`;
  if (max) return `under Rs.${max.toLocaleString("en-IN")}`;
  if (min) return `above Rs.${min.toLocaleString("en-IN")}`;
  return "";
}

export function useChat() {
  const store = useChatStore();
  const { fetchCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkAiHealth()
      .then(() => store.setServiceAvailable(true))
      .catch(() => store.setServiceAvailable(false));
    getCategories()
      .then((c) => {
        cachedCategories = c;
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stream Ollama ─────────────────────────────────────────────────────────
  const streamOllamaAnswer = useCallback(
    (question: string, afterChips?: ActionChip[]) => {
      store.transition("STREAMING_ANSWER");
      store.setLoading(true);
      const id = store.startAssistantMessage();
      store.setActiveStreamId(id);
      const history = store.getApiHistory().slice(0, -1);
      const cb: StreamCallbacks = {
        onToken: (t) => store.appendToken(id, t),
        onSources: (sources) => {
          useChatStore.setState((s) => ({
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, sources } : m,
            ),
          }));
        },
        onDone: () => {
          store.finishAssistantMessage(id, undefined, afterChips);
          abortRef.current = null;
        },
        onError: (msg) => {
          store.setAssistantError(id, msg);
          abortRef.current = null;
        },
      };
      abortRef.current = askAiStream(question, history, cb);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Help ──────────────────────────────────────────────────────────────────
  const handleHelp = useCallback(() => {
    store.addAssistantTextMessage(
      "Here is what I can help you with:\n\n" +
        "**Search & Browse**\n" +
        '- "Show me laptops" - browse a category\n' +
        '- "Mobiles under 20000" - filter by max price\n' +
        '- "Books between 200 and 500" - filter by price range\n' +
        '- "Cheap sports equipment" - keyword search\n' +
        '- "Electronics above 5000" - filter by min price\n\n' +
        "**Cart & Orders**\n" +
        '- "Add the first one to cart" - add shown product\n' +
        '- "Compare the first two" - side-by-side comparison\n' +
        '- "Where is my order?" - track orders\n' +
        '- "Cancel my order" - cancel a recent order\n\n' +
        "**Reviews**\n" +
        '- "Rate this product" - leave a star rating\n\n' +
        "Just type naturally — I understand plain English!",
      [
        { label: "Show all products", message: "Show me all products" },
        { label: "Laptops under 50000", message: "Laptops under 50000" },
        { label: "Books 200 to 500", message: "Books between 200 and 500" },
        { label: "Track my order", message: "Where is my order?" },
      ],
    );
    store.transition("IDLE");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Product search ────────────────────────────────────────────────────────
  const handleProductSearch = useCallback(
    async (
      query: string | undefined,
      minPrice?: number,
      maxPrice?: number,
      categoryHint?: string,
    ) => {
      store.transition("SEARCHING_PRODUCTS");
      store.setLoading(true);

      const categoryId = categoryHint
        ? await resolveCategoryId(categoryHint)
        : undefined;
      const whatLabel = categoryHint ?? query ?? "products";
      const priceStr = priceLabel(minPrice, maxPrice);
      const searchDesc = [whatLabel, priceStr].filter(Boolean).join(" ");

      // KEY FIX: when we have a valid categoryId, don't also send the category
      // name as a text query — the API would search product names for "electronics"
      // and find nothing. Use categoryId for filtering, query only for keyword search.
      const effectiveQuery = categoryId
        ? query && query.trim()
          ? query.trim()
          : undefined // only non-category keywords
        : query?.trim() || undefined;

      try {
        const result = await getProducts({
          query: effectiveQuery,
          categoryId,
          minPrice,
          maxPrice,
          pageSize: 6,
          sortBy: minPrice || maxPrice ? "price_asc" : "newest",
        });

        if (result.items.length === 0) {
          const relaxChips: ActionChip[] = [];
          if (minPrice || maxPrice) {
            relaxChips.push({
              label: `All ${whatLabel}`,
              message: categoryHint
                ? `Show me ${categoryHint}`
                : "Show me all products",
            });
          }
          relaxChips.push(
            { label: "Show Electronics", message: "Show me electronics" },
            { label: "Show all products", message: "Show me all products" },
          );
          store.addAssistantTextMessage(
            `No products found for "${searchDesc}". Try adjusting your search or price range.`,
            relaxChips,
          );
          store.transition("IDLE");
          store.setLoading(false);
          return;
        }

        store.transition("SHOWING_PRODUCTS");

        const chips: ActionChip[] = [
          { label: "Compare top 2", message: "Compare the first two" },
          { label: "Add first to cart", message: "Add the first one to cart" },
          { label: "Rate first product", message: "Rate this product" },
        ];
        if (result.totalCount > 6) {
          chips.push({
            label: `All ${result.totalCount} results`,
            message: `Show me more ${whatLabel}`,
          });
        }

        store.addProductCardsMessage(result.items, chips, categoryId);
        store.setLoading(false);
        store.transition("IDLE");
      } catch {
        store.addErrorMessage("Failed to search products. Please try again.");
        store.transition("ERROR");
        store.setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Order tracking ────────────────────────────────────────────────────────
  const handleOrderTrack = useCallback(async () => {
    if (!isAuthenticated) {
      store.addAssistantTextMessage(
        "You need to be logged in to view your orders.",
        [{ label: "How do I login?", message: "How do I login?" }],
      );
      store.transition("IDLE");
      return;
    }
    store.transition("FETCHING_ORDERS");
    store.setLoading(true);
    try {
      const result = await getMyOrders(1, 5);
      if (result.items.length === 0) {
        store.addAssistantTextMessage(
          "You have not placed any orders yet. Start shopping!",
          [{ label: "Browse products", message: "Show me all products" }],
        );
        store.transition("IDLE");
        store.setLoading(false);
        return;
      }
      store.transition("SHOWING_ORDERS");
      store.addOrderTimelineMessage(result.items, [
        { label: "Cancel latest order", message: "Cancel my latest order" },
        { label: "View all orders", message: "Show all my orders" },
      ]);
      store.setLoading(false);
      store.transition("IDLE");
    } catch {
      store.addErrorMessage("Failed to fetch your orders. Please try again.");
      store.transition("ERROR");
      store.setLoading(false);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    async (product?: ProductDto) => {
      if (!isAuthenticated) {
        store.addAssistantTextMessage(
          "You need to be logged in to add items to your cart.",
          [{ label: "How do I login?", message: "How do I login?" }],
        );
        store.transition("IDLE");
        return;
      }
      const target = product ?? store.lastShownProducts[0];
      if (!target) {
        store.addAssistantTextMessage(
          "Search for a product first, then I can add it to your cart.",
          [{ label: "Search products", message: "Show me all products" }],
        );
        store.transition("IDLE");
        return;
      }
      store.transition("ADDING_TO_CART");
      store.setLoading(true);
      try {
        await addToCart({
          productId: target.id,
          productName: target.name,
          unitPrice: target.price,
          quantity: 1,
          availableStock: target.stockQuantity,
        });
        await fetchCart();
        store.transition("CART_UPDATED");
        store.addCartUpdatedMessage(target.name, 1);
        showToast.success(`${target.name} added to cart!`);
        store.setLoading(false);
        store.transition("IDLE");
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Could not add to cart.";
        store.addErrorMessage(msg);
        store.transition("ERROR");
        store.setLoading(false);
      }
    },
    [isAuthenticated, fetchCart], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Compare ───────────────────────────────────────────────────────────────
  const handleCompare = useCallback(() => {
    const products = store.lastShownProducts;
    if (products.length < 2) {
      store.addAssistantTextMessage(
        "I need at least 2 products to compare. Search for something first.",
        [{ label: "Show me laptops", message: "Show me laptops" }],
      );
      store.transition("IDLE");
      return;
    }
    store.transition("COMPARING");
    store.addCompareMessage([products[0], products[1]]);
    store.transition("IDLE");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rate product ──────────────────────────────────────────────────────────
  const handleRateProduct = useCallback(() => {
    const products = store.lastShownProducts;
    if (products.length === 0) {
      store.addAssistantTextMessage(
        "Search for a product first, then I can show you the rating widget.",
        [{ label: "Search products", message: "Show me all products" }],
      );
      store.transition("IDLE");
      return;
    }
    store.transition("AWAITING_RATING");
    store.addRatingWidgetMessage(products[0].id, products[0].name);
    store.transition("IDLE");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cancel order ──────────────────────────────────────────────────────────
  const handleCancelOrder = useCallback(async () => {
    if (!isAuthenticated) {
      store.addAssistantTextMessage(
        "You need to be logged in to cancel orders.",
      );
      store.transition("IDLE");
      return;
    }
    const orders = store.lastShownOrders;
    if (orders.length === 0) {
      await handleOrderTrack();
      return;
    }
    const cancellable = orders.find((o) =>
      ["Paid", "PaymentPending", "Packed"].includes(o.status),
    );
    if (!cancellable) {
      store.addAssistantTextMessage(
        "None of your recent orders can be cancelled. Orders can only be cancelled when in **Paid**, **PaymentPending**, or **Packed** status.",
        [{ label: "View orders", message: "Show my orders" }],
      );
      store.transition("IDLE");
      return;
    }
    store.transition("CONFIRMING_CANCEL");
    store.addConfirmCancelMessage(cancellable.id, cancellable.orderNumber);
    store.transition("IDLE");
  }, [isAuthenticated, handleOrderTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit rating ─────────────────────────────────────────────────────────
  const submitProductRating = useCallback(
    async (productId: string, stars: number, reviewText?: string) => {
      if (!isAuthenticated) {
        showToast.error("Please login to rate products.");
        return;
      }
      try {
        await submitRating(productId, stars, reviewText);
        store.addAssistantTextMessage(
          `Thanks for your ${stars}-star rating! Your feedback helps other shoppers.`,
          [
            { label: "Rate another product", message: "Rate a product" },
            { label: "Continue shopping", message: "Show me all products" },
          ],
        );
        showToast.success("Rating submitted!");
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Could not submit rating.";
        showToast.error(msg);
      }
    },
    [isAuthenticated], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Confirm cancel ────────────────────────────────────────────────────────
  const confirmCancelOrder = useCallback(async (orderId: string) => {
    try {
      await cancelOrder(orderId, "Cancelled via AI assistant");
      store.addAssistantTextMessage(
        "Your order has been cancelled successfully. A refund will be processed if applicable.",
        [{ label: "View orders", message: "Show my orders" }],
      );
      showToast.success("Order cancelled.");
      store.setPendingCancel(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not cancel order.";
      store.addErrorMessage(msg);
      showToast.error(msg);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate to product ───────────────────────────────────────────────────
  const goToProduct = useCallback(
    (productId: string) => {
      navigate(buildRoute(ROUTES.CUSTOMER.PRODUCT_DETAIL, { id: productId }));
      store.closeChat();
    },
    [navigate], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Main sendMessage ──────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || store.isLoading) return;

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      store.addUserMessage(trimmed);
      store.transition("CLASSIFYING");

      const classified = classifyIntent(trimmed);

      switch (classified.intent) {
        case "HELP":
          handleHelp();
          break;

        case "PRODUCT_SEARCH": {
          // Re-extract price range from the raw text for accuracy
          const { minPrice, maxPrice } = extractPriceRange(trimmed);
          const categoryHint =
            classified.categoryHint ?? extractCategory(trimmed);
          // searchQuery is already stripped of category words by extractSearchQuery
          // If it equals the category name, treat it as undefined (use categoryId instead)
          const rawQuery = classified.searchQuery;
          const queryIsJustCategory =
            rawQuery &&
            categoryHint &&
            rawQuery.toLowerCase() === categoryHint.toLowerCase();
          const searchQuery = queryIsJustCategory ? undefined : rawQuery;
          await handleProductSearch(
            searchQuery,
            minPrice,
            maxPrice,
            categoryHint,
          );
          break;
        }

        case "ORDER_TRACK":
          await handleOrderTrack();
          break;

        case "ADD_TO_CART": {
          const indexMatch = trimmed.match(
            /\b(first|1st|second|2nd|third|3rd|last)\b/i,
          );
          let targetProduct: ProductDto | undefined;
          if (indexMatch) {
            const w = indexMatch[1].toLowerCase();
            const idx = ["first", "1st"].includes(w)
              ? 0
              : ["second", "2nd"].includes(w)
                ? 1
                : ["third", "3rd"].includes(w)
                  ? 2
                  : store.lastShownProducts.length - 1;
            targetProduct = store.lastShownProducts[idx];
          }
          await handleAddToCart(targetProduct);
          break;
        }

        case "COMPARE_PRODUCTS":
          handleCompare();
          break;

        case "RATE_PRODUCT":
          handleRateProduct();
          break;

        case "CANCEL_ORDER":
          await handleCancelOrder();
          break;

        case "CART_VIEW":
          navigate(ROUTES.CUSTOMER.CART);
          store.addAssistantTextMessage("Taking you to your cart!", [
            { label: "Continue shopping", message: "Show me all products" },
          ]);
          store.transition("IDLE");
          break;

        case "GENERAL_QA":
        default:
          streamOllamaAnswer(trimmed, [
            { label: "Search products", message: "Show me all products" },
            { label: "Track order", message: "Where is my order?" },
            { label: "Help", message: "help" },
          ]);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.isLoading, isAuthenticated],
  );

  // ── Cancel stream ─────────────────────────────────────────────────────────
  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const { messages } = useChatStore.getState();
    const streaming = messages.find((m) => m.isStreaming);
    if (streaming) useChatStore.getState().finishAssistantMessage(streaming.id);
  }, []);

  return {
    messages: store.messages,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    isServiceAvailable: store.isServiceAvailable,
    machineState: store.machineState,
    mode: store.mode,
    lastShownProducts: store.lastShownProducts,
    openChat: store.openChat,
    closeChat: store.closeChat,
    toggleChat: store.toggleChat,
    sendMessage,
    cancelStream,
    clearHistory: store.clearHistory,
    submitProductRating,
    confirmCancelOrder,
    goToProduct,
    handleAddToCart,
  };
}
