import { useState } from "react";
import {
  ChevronDown, ChevronUp, AlertCircle, Bot, User,
  ShoppingCart, CheckCircle2,
} from "lucide-react";
import type { ChatMessageEntry } from "../store/chatStore";
import { ChatProductGrid } from "./ChatProductGrid";
import { ChatOrderTimeline } from "./ChatOrderTimeline";
import { ChatCompareTable } from "./ChatCompareTable";
import { ChatRatingWidget } from "./ChatRatingWidget";
import { ChatConfirmDialog } from "./ChatConfirmDialog";
import { ChatActionChips } from "./ChatActionChips";
import { useChat } from "../hooks/useChat";

interface Props {
  message: ChatMessageEntry;
}

// ── Text formatter ────────────────────────────────────────────────────────────

function formatText(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i, arr) => {
    // Bold: **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
        )}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ── Main component ────────────────────────────────────────────────────────────

export const ChatMessage = ({ message }: Props) => {
  const { sendMessage, isLoading } = useChat();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === "user";

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatar = (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 ${
        isUser
          ? "bg-[color:var(--primary)] text-white"
          : message.isError
            ? "bg-red-100 text-red-500"
            : message.type === "cart_updated"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-[color:var(--surface-alt,#f1f5f9)] text-[color:var(--primary)]"
      }`}
    >
      {isUser ? (
        <User size={14} />
      ) : message.isError ? (
        <AlertCircle size={14} />
      ) : message.type === "cart_updated" ? (
        <ShoppingCart size={14} />
      ) : (
        <Bot size={14} />
      )}
    </div>
  );

  // ── Bubble content dispatcher ─────────────────────────────────────────────
  const renderContent = () => {
    // User messages are always plain text
    if (isUser) {
      return (
        <p className="text-sm leading-relaxed break-words">
          {message.content}
        </p>
      );
    }

    switch (message.type) {
      case "product_cards":
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text)]">
              {message.content}
            </p>
            {message.products && message.products.length > 0 && (
              <ChatProductGrid
                products={message.products}
                categoryId={message.productCategoryId}
              />
            )}
          </div>
        );

      case "order_timeline":
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text)]">
              Here are your recent orders:
            </p>
            {message.orders && <ChatOrderTimeline orders={message.orders} />}
          </div>
        );

      case "compare_table":
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text)]">
              Here's a side-by-side comparison:
            </p>
            {message.compareProducts && (
              <ChatCompareTable products={message.compareProducts} />
            )}
          </div>
        );

      case "rating_widget":
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text)]">
              How would you rate this product?
            </p>
            {message.ratingProductId && message.ratingProductName && (
              <ChatRatingWidget
                productId={message.ratingProductId}
                productName={message.ratingProductName}
              />
            )}
          </div>
        );

      case "confirm_dialog":
        return (
          <ChatConfirmDialog
            orderId={message.confirmOrderId!}
            title={message.confirmTitle!}
            message={message.confirmMessage!}
          />
        );

      case "cart_updated":
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">
              Added {message.cartQty}× <strong>{message.cartProductName}</strong> to your cart!
            </p>
          </div>
        );

      case "text":
      default:
        return (
          <div>
            {message.content ? (
              <p className="text-sm leading-relaxed break-words">
                {formatText(message.content)}
              </p>
            ) : message.isStreaming ? null : (
              <p className="text-sm opacity-50 italic">Empty response</p>
            )}
            {/* Streaming cursor */}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        );
    }
  };

  // ── Bubble wrapper ────────────────────────────────────────────────────────
  const bubbleClass = isUser
    ? "bg-[color:var(--primary)] text-white rounded-br-sm"
    : message.isError
      ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
      : message.type === "cart_updated"
        ? "bg-emerald-50 border border-emerald-200 rounded-bl-sm"
        : "bg-[color:var(--surface)] border border-[color:var(--border-soft)] text-[color:var(--text)] rounded-bl-sm shadow-sm";

  // Wide messages (product grid, compare, orders) need more space
  const isWide = ["product_cards", "order_timeline", "compare_table"].includes(
    message.type,
  );

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {avatar}

      <div
        className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"} ${
          isWide ? "max-w-[95%]" : "max-w-[82%]"
        }`}
      >
        {/* Main bubble */}
        <div className={`px-3.5 py-2.5 rounded-2xl ${bubbleClass} ${isWide ? "w-full" : ""}`}>
          {renderContent()}
        </div>

        {/* RAG sources accordion */}
        {!isUser && !message.isError && message.sources && message.sources.length > 0 && (
          <>
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="flex items-center gap-1 text-[11px] text-[color:var(--text-soft)] hover:text-[color:var(--primary)] transition-colors px-1"
            >
              {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
            </button>
            {sourcesOpen && (
              <div className="w-full bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-xl p-2.5 text-[11px] text-[color:var(--text-soft)] space-y-1.5 shadow-sm">
                {message.sources.map((src, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 font-bold text-[color:var(--primary)] mt-0.5">
                      [{i + 1}]
                    </span>
                    <span>
                      <span className="font-semibold text-[color:var(--text)]">
                        {src.filename}
                      </span>
                      {" · "}chunk {src.chunk_no}
                      {" · "}score {src.score.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Action chips */}
        {!isUser && message.chips && message.chips.length > 0 && !message.isStreaming && (
          <ChatActionChips
            chips={message.chips}
            onSend={sendMessage}
            disabled={isLoading}
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-[color:var(--text-soft)] opacity-60 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};
