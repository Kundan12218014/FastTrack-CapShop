import { useEffect, useRef } from "react";
import { Bot, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { useChat } from "../hooks/useChat";

/**
 * ChatWidget — the floating action button + slide-up panel.
 *
 * Renders a fixed-position button in the bottom-right corner.
 * Clicking it opens/closes the chat panel.
 *
 * The panel is rendered in a portal-like fixed container so it
 * sits above all other content regardless of scroll position.
 *
 * Usage: mount once in a layout (CustomerLayout / AdminLayout) or App.tsx.
 */
export const ChatWidget = () => {
  const { isOpen, toggleChat, messages, isLoading } = useChat();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) toggleChat();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, toggleChat]);

  // Count unread messages (assistant messages received while panel was closed)
  const unreadCount = isOpen
    ? 0
    : messages.filter(
        (m) => m.role === "assistant" && !m.isStreaming,
      ).length;

  // Show a badge only if there are messages beyond the initial welcome
  const showBadge = !isOpen && unreadCount > 1;

  return (
    <>
      {/* ── Floating toggle button ─────────────────────────────────────── */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${isOpen
            ? "bg-gray-700 hover:bg-gray-800 rotate-0 scale-95"
            : "bg-[color:var(--primary)] hover:bg-[color:var(--primary-dark,#1d4ed8)] hover:scale-110"
          }
          text-white
          focus:outline-none focus:ring-4 focus:ring-[color:var(--primary)]/30
        `}
      >
        {isOpen ? <X size={22} /> : <Bot size={24} />}

        {/* Unread badge */}
        {showBadge && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Pulse ring when AI is responding */}
        {isLoading && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-[color:var(--primary)] animate-ping opacity-30 pointer-events-none" />
        )}
      </button>

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`
          fixed bottom-24 right-6 z-50
          w-[370px] max-w-[calc(100vw-2rem)]
          h-[560px] max-h-[calc(100vh-8rem)]
          bg-[color:var(--surface)] rounded-2xl shadow-2xl
          border border-[color:var(--border-soft)]
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }
        `}
        role="dialog"
        aria-label="CapShop AI Assistant"
        aria-modal="false"
      >
        {isOpen && <ChatPanel />}
      </div>
    </>
  );
};
