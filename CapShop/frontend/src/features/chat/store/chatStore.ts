import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSource } from "../../../api/chatApi";
import type { ProductDto } from "../../../api/catalogApi";
import type { OrderSummaryDto } from "../../../api/orderApi";
import type { ChatState, ChatMode } from "../engine/chatStateMachine";
import { getModeFromState } from "../engine/chatStateMachine";

// ── Message types ─────────────────────────────────────────────────────────────

export type MessageType =
  | "text"
  | "product_cards"
  | "order_timeline"
  | "compare_table"
  | "rating_widget"
  | "action_chips"
  | "confirm_dialog"
  | "cart_updated";

export interface ActionChip {
  label: string;
  /** The message to send when this chip is clicked */
  message: string;
  icon?: string;
}

export interface ChatMessageEntry {
  id: string;
  role: "user" | "assistant";
  /** Primary text content (for text messages) */
  content: string;
  /** Discriminated union type — drives which component renders */
  type: MessageType;
  /** Streaming: true while tokens are still arriving */
  isStreaming?: boolean;
  /** RAG sources retrieved for this message */
  sources?: ChatSource[];
  /** ISO timestamp */
  timestamp: string;
  /** True if this message is an error notice */
  isError?: boolean;
  /** Product cards payload */
  products?: ProductDto[];
  /** Category ID used when browsing by category — for "See all" navigation */
  productCategoryId?: number;
  /** Orders payload */
  orders?: OrderSummaryDto[];
  /** Compare table: exactly 2 products */
  compareProducts?: [ProductDto, ProductDto];
  /** Rating widget: which product to rate */
  ratingProductId?: string;
  ratingProductName?: string;
  /** Action chips to show below this message */
  chips?: ActionChip[];
  /** Confirm dialog payload */
  confirmTitle?: string;
  confirmMessage?: string;
  confirmOrderId?: string;
  /** Cart updated: product name + qty */
  cartProductName?: string;
  cartQty?: number;
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface ChatStoreState {
  // UI
  isOpen: boolean;
  // State machine
  machineState: ChatState;
  mode: ChatMode;
  // Messages
  messages: ChatMessageEntry[];
  // Loading / streaming
  isLoading: boolean;
  isServiceAvailable: boolean | null;
  activeStreamId: string | null;
  // Context memory — remembers last shown data for follow-up commands
  lastShownProducts: ProductDto[];
  lastShownOrders: OrderSummaryDto[];
  pendingCancelOrderId: string | null;
  pendingRatingProductId: string | null;
  pendingRatingProductName: string | null;

  // Actions — UI
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  // Actions — state machine
  transition: (to: ChatState) => void;

  // Actions — messages
  addUserMessage: (content: string) => string;
  addAssistantTextMessage: (content: string, chips?: ActionChip[]) => string;
  addProductCardsMessage: (
    products: ProductDto[],
    chips?: ActionChip[],
    categoryId?: number,
  ) => string;
  addOrderTimelineMessage: (
    orders: OrderSummaryDto[],
    chips?: ActionChip[],
  ) => string;
  addCompareMessage: (products: [ProductDto, ProductDto]) => string;
  addRatingWidgetMessage: (productId: string, productName: string) => string;
  addConfirmCancelMessage: (orderId: string, orderNumber: string) => string;
  addCartUpdatedMessage: (productName: string, qty: number) => string;
  addErrorMessage: (content: string) => string;
  startAssistantMessage: () => string;
  appendToken: (id: string, token: string) => void;
  finishAssistantMessage: (
    id: string,
    sources?: ChatSource[],
    chips?: ActionChip[],
  ) => void;
  setAssistantError: (id: string, message: string) => void;

  // Actions — flags
  setLoading: (loading: boolean) => void;
  setServiceAvailable: (available: boolean) => void;
  setActiveStreamId: (id: string | null) => void;

  // Actions — context memory
  setLastShownProducts: (products: ProductDto[]) => void;
  setLastShownOrders: (orders: OrderSummaryDto[]) => void;
  setPendingCancel: (orderId: string | null) => void;
  setPendingRating: (
    productId: string | null,
    productName: string | null,
  ) => void;

  // Actions — session
  clearHistory: () => void;

  // Derived
  getApiHistory: () => ChatMessage[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

const WELCOME_MESSAGE: ChatMessageEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your **CapShop Assistant** — powered by AI.\n\n" +
    "I can help you:\n" +
    "- Search products by name, category, or price range\n" +
    "- Track and manage your orders\n" +
    "- Compare products side by side\n" +
    "- Add items to cart and rate products\n\n" +
    "Try asking things like:\n" +
    '- "Laptops between 40000 and 80000"\n' +
    '- "Mobiles under 20000"\n' +
    '- "Where is my order?"',
  type: "text",
  timestamp: new Date().toISOString(),
  chips: [
    { label: "Show me laptops", message: "Show me laptops" },
    { label: "Mobiles under 20000", message: "Mobiles under 20000" },
    { label: "Books 200-500", message: "Books between 200 and 500" },
    { label: "Help", message: "help" },
  ],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      machineState: "IDLE",
      mode: "general",
      messages: [WELCOME_MESSAGE],
      isLoading: false,
      isServiceAvailable: null,
      activeStreamId: null,
      lastShownProducts: [],
      lastShownOrders: [],
      pendingCancelOrderId: null,
      pendingRatingProductId: null,
      pendingRatingProductName: null,

      // ── UI ──────────────────────────────────────────────────────────────
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

      // ── State machine ───────────────────────────────────────────────────
      transition: (to) => set({ machineState: to, mode: getModeFromState(to) }),

      // ── Messages ────────────────────────────────────────────────────────
      addUserMessage: (content) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            { id, role: "user", content, type: "text", timestamp: now() },
          ],
        }));
        return id;
      },

      addAssistantTextMessage: (content, chips) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content,
              type: "text",
              timestamp: now(),
              chips,
            },
          ],
        }));
        return id;
      },

      addProductCardsMessage: (products, chips, categoryId) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: `Found ${products.length} product${products.length !== 1 ? "s" : ""} for you`,
              type: "product_cards",
              products,
              productCategoryId: categoryId,
              chips,
              timestamp: now(),
            },
          ],
          lastShownProducts: products,
        }));
        return id;
      },

      addOrderTimelineMessage: (orders, chips) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: `Found ${orders.length} order${orders.length !== 1 ? "s" : ""}`,
              type: "order_timeline",
              orders,
              chips,
              timestamp: now(),
            },
          ],
          lastShownOrders: orders,
        }));
        return id;
      },

      addCompareMessage: (products) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: "Here's a comparison",
              type: "compare_table",
              compareProducts: products,
              timestamp: now(),
            },
          ],
        }));
        return id;
      },

      addRatingWidgetMessage: (productId, productName) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: `Rate ${productName}`,
              type: "rating_widget",
              ratingProductId: productId,
              ratingProductName: productName,
              timestamp: now(),
            },
          ],
          pendingRatingProductId: productId,
          pendingRatingProductName: productName,
        }));
        return id;
      },

      addConfirmCancelMessage: (orderId, orderNumber) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: `Cancel order ${orderNumber}?`,
              type: "confirm_dialog",
              confirmTitle: "Cancel Order",
              confirmMessage: `Are you sure you want to cancel order ${orderNumber}? This action cannot be undone.`,
              confirmOrderId: orderId,
              timestamp: now(),
            },
          ],
          pendingCancelOrderId: orderId,
        }));
        return id;
      },

      addCartUpdatedMessage: (productName, qty) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: `Added ${qty}x ${productName} to cart`,
              type: "cart_updated",
              cartProductName: productName,
              cartQty: qty,
              timestamp: now(),
              chips: [
                { label: "View Cart", message: "Show my cart" },
                {
                  label: "Continue Shopping",
                  message: "Show me more products",
                },
              ],
            },
          ],
        }));
        return id;
      },

      addErrorMessage: (content) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content,
              type: "text",
              isError: true,
              timestamp: now(),
            },
          ],
        }));
        return id;
      },

      startAssistantMessage: () => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id,
              role: "assistant",
              content: "",
              type: "text",
              isStreaming: true,
              timestamp: now(),
            },
          ],
        }));
        return id;
      },

      appendToken: (id, token) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + token } : m,
          ),
        }));
      },

      finishAssistantMessage: (id, sources, chips) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id
              ? { ...m, isStreaming: false, sources, chips: chips ?? m.chips }
              : m,
          ),
          isLoading: false,
          activeStreamId: null,
          machineState: "IDLE",
          mode: "general",
        }));
      },

      setAssistantError: (id, message) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id
              ? { ...m, content: message, isStreaming: false, isError: true }
              : m,
          ),
          isLoading: false,
          activeStreamId: null,
          machineState: "ERROR",
        }));
      },

      // ── Flags ────────────────────────────────────────────────────────────
      setLoading: (loading) => set({ isLoading: loading }),
      setServiceAvailable: (available) =>
        set({ isServiceAvailable: available }),
      setActiveStreamId: (id) => set({ activeStreamId: id }),

      // ── Context memory ───────────────────────────────────────────────────
      setLastShownProducts: (products) => set({ lastShownProducts: products }),
      setLastShownOrders: (orders) => set({ lastShownOrders: orders }),
      setPendingCancel: (orderId) => set({ pendingCancelOrderId: orderId }),
      setPendingRating: (productId, productName) =>
        set({
          pendingRatingProductId: productId,
          pendingRatingProductName: productName,
        }),

      // ── Session ──────────────────────────────────────────────────────────
      clearHistory: () =>
        set({
          messages: [WELCOME_MESSAGE],
          machineState: "IDLE",
          mode: "general",
          lastShownProducts: [],
          lastShownOrders: [],
          pendingCancelOrderId: null,
          pendingRatingProductId: null,
          pendingRatingProductName: null,
        }),

      // ── Derived ──────────────────────────────────────────────────────────
      getApiHistory: () => {
        const { messages } = get();
        return messages
          .filter(
            (m) =>
              !m.isStreaming &&
              !m.isError &&
              m.type === "text" &&
              m.content.trim(),
          )
          .slice(-12) // last 12 text turns
          .map((m) => ({ role: m.role, content: m.content }));
      },
    }),
    {
      name: "capshop-chat-v2",
      partialize: (s) => ({
        messages: s.messages.slice(-30),
        isOpen: s.isOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isLoading = false;
        state.activeStreamId = null;
        state.machineState = "IDLE";
        state.mode = "general";
        state.messages = state.messages.map((m) =>
          m.isStreaming
            ? {
                ...m,
                isStreaming: false,
                isError: true,
                content: m.content || "Message interrupted.",
              }
            : m,
        );
        if (state.messages.length === 0) {
          state.messages = [WELCOME_MESSAGE];
        }
      },
    },
  ),
);
