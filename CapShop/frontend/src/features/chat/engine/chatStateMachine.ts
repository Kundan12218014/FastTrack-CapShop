/**
 * Chat State Machine
 *
 * Defines all possible states the chatbot can be in and the valid
 * transitions between them. This is a pure data/logic module —
 * no React, no side effects.
 *
 * States map to what the UI renders:
 *   IDLE              → empty input, quick prompts visible
 *   CLASSIFYING       → spinner while intent is being determined
 *   SEARCHING_PRODUCTS → skeleton product cards
 *   SHOWING_PRODUCTS  → product card grid rendered in chat
 *   FETCHING_ORDERS   → skeleton order list
 *   SHOWING_ORDERS    → order timeline rendered in chat
 *   ADDING_TO_CART    → spinner on the add button
 *   CART_UPDATED      → success chip shown
 *   COMPARING         → compare table rendered
 *   AWAITING_RATING   → star rating widget rendered
 *   CONFIRMING_CANCEL → confirm dialog rendered
 *   STREAMING_ANSWER  → Ollama tokens streaming in
 *   ERROR             → error bubble shown
 */

export type ChatState =
  | "IDLE"
  | "CLASSIFYING"
  | "SEARCHING_PRODUCTS"
  | "SHOWING_PRODUCTS"
  | "FETCHING_ORDERS"
  | "SHOWING_ORDERS"
  | "ADDING_TO_CART"
  | "CART_UPDATED"
  | "COMPARING"
  | "AWAITING_RATING"
  | "CONFIRMING_CANCEL"
  | "STREAMING_ANSWER"
  | "ERROR";

export type ChatMode = "shopping" | "support" | "general";

/** Derive the current chat mode from the state */
export function getModeFromState(state: ChatState): ChatMode {
  switch (state) {
    case "SEARCHING_PRODUCTS":
    case "SHOWING_PRODUCTS":
    case "ADDING_TO_CART":
    case "CART_UPDATED":
    case "COMPARING":
    case "AWAITING_RATING":
      return "shopping";
    case "FETCHING_ORDERS":
    case "SHOWING_ORDERS":
    case "CONFIRMING_CANCEL":
      return "support";
    default:
      return "general";
  }
}

/** Human-readable label for the mode badge */
export const MODE_LABELS: Record<ChatMode, string> = {
  shopping: "Shopping",
  support: "Support",
  general: "General",
};

export const MODE_COLORS: Record<ChatMode, string> = {
  shopping: "bg-emerald-100 text-emerald-700",
  support: "bg-blue-100 text-blue-700",
  general: "bg-gray-100 text-gray-600",
};

/** Valid transitions — used for debugging / guards */
export const TRANSITIONS: Record<ChatState, ChatState[]> = {
  IDLE: ["CLASSIFYING"],
  CLASSIFYING: [
    "SEARCHING_PRODUCTS",
    "FETCHING_ORDERS",
    "ADDING_TO_CART",
    "COMPARING",
    "AWAITING_RATING",
    "CONFIRMING_CANCEL",
    "STREAMING_ANSWER",
    "ERROR",
  ],
  SEARCHING_PRODUCTS: ["SHOWING_PRODUCTS", "STREAMING_ANSWER", "ERROR"],
  SHOWING_PRODUCTS: [
    "ADDING_TO_CART",
    "COMPARING",
    "AWAITING_RATING",
    "CLASSIFYING",
    "IDLE",
  ],
  FETCHING_ORDERS: ["SHOWING_ORDERS", "STREAMING_ANSWER", "ERROR"],
  SHOWING_ORDERS: ["CONFIRMING_CANCEL", "CLASSIFYING", "IDLE"],
  ADDING_TO_CART: ["CART_UPDATED", "ERROR"],
  CART_UPDATED: ["IDLE", "CLASSIFYING"],
  COMPARING: ["IDLE", "CLASSIFYING"],
  AWAITING_RATING: ["IDLE", "CLASSIFYING"],
  CONFIRMING_CANCEL: ["IDLE", "CLASSIFYING"],
  STREAMING_ANSWER: ["IDLE", "ERROR"],
  ERROR: ["IDLE"],
};

export function canTransition(from: ChatState, to: ChatState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
