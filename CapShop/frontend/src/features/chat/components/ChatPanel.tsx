import { useEffect, useRef } from "react";
import { WifiOff, Loader2 } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat } from "../hooks/useChat";

export const ChatPanel = () => {
  const {
    messages,
    isLoading,
    isServiceAvailable,
    mode,
    machineState,
    closeChat,
    sendMessage,
    cancelStream,
    clearHistory,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or tokens stream in
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll to bottom when panel opens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  // Show skeleton loader for product/order fetching states
  const showSkeleton =
    machineState === "SEARCHING_PRODUCTS" || machineState === "FETCHING_ORDERS";

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        onClose={closeChat}
        onClear={clearHistory}
        isServiceAvailable={isServiceAvailable}
        mode={mode}
      />

      {/* Offline banner */}
      {isServiceAvailable === false && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium">
          <WifiOff size={13} />
          AI service offline. Make sure Ollama is running.
        </div>
      )}

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Skeleton loader for product/order fetching */}
        {showSkeleton && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-[color:var(--surface-alt,#f1f5f9)] flex items-center justify-center shrink-0">
              <Loader2 size={14} className="animate-spin text-[color:var(--primary)]" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-[140px] h-[200px] bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Typing dots for streaming */}
        {isLoading &&
          !showSkeleton &&
          messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-[color:var(--surface-alt,#f1f5f9)] flex items-center justify-center shrink-0">
                <span className="text-[color:var(--primary)] text-xs font-bold">AI</span>
              </div>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border-soft)] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] opacity-60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] opacity-60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] opacity-60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isLoading={isLoading}
        disabled={isServiceAvailable === false}
        mode={mode}
      />
    </div>
  );
};
