import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Square, HelpCircle } from "lucide-react";
import type { ChatMode } from "../engine/chatStateMachine";

interface Props {
  onSend: (message: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  disabled?: boolean;
  mode: ChatMode;
}

// Context-aware quick prompts — rotate randomly so they feel fresh
const QUICK_PROMPTS: Record<ChatMode, string[][]> = {
  general: [
    ["Show me laptops", "Track my order", "Books 200-500", "Help"],
    ["Mobiles under 20000", "Where is my order?", "Show me beauty", "Help"],
    ["Cheap sports gear", "Show me electronics", "Browse fashion", "Help"],
  ],
  shopping: [
    ["Compare top 2", "Add first to cart", "Rate this product", "Show more"],
    ["Add second to cart", "Compare first two", "Show cheaper options", "Help"],
  ],
  support: [
    ["Cancel latest order", "Show all orders", "Track shipment", "Help"],
  ],
};

// Placeholder hints that rotate to teach users what they can type
const PLACEHOLDERS: Record<ChatMode, string[]> = {
  general: [
    "Try: Laptops between 40000 and 80000",
    "Try: Mobiles under 20000",
    "Try: Books between 200 and 500",
    "Try: Cheap sports equipment",
    "Ask me anything about CapShop...",
    "Try: Show me electronics above 5000",
  ],
  shopping: [
    "Compare, add to cart, or search more...",
    "Try: Add the second one to cart",
    "Try: Compare the first two",
  ],
  support: [
    "Ask about your orders...",
    "Try: Cancel my latest order",
  ],
};

function pickRandom<T>(arr: T[][]): T[] {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomStr(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const ChatInput = ({ onSend, onCancel, isLoading, disabled, mode }: Props) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Pick prompts once per render cycle (stable via ref)
  const promptsRef = useRef<string[]>(pickRandom(QUICK_PROMPTS[mode] ?? QUICK_PROMPTS.general));
  const placeholderRef = useRef<string>(pickRandomStr(PLACEHOLDERS[mode] ?? PLACEHOLDERS.general));

  // Re-pick when mode changes
  if (promptsRef.current.length === 0) {
    promptsRef.current = pickRandom(QUICK_PROMPTS[mode] ?? QUICK_PROMPTS.general);
    placeholderRef.current = pickRandomStr(PLACEHOLDERS[mode] ?? PLACEHOLDERS.general);
  }

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const isEmpty = value.trim().length === 0;

  return (
    <div className="border-t border-[color:var(--border-soft)] bg-[color:var(--surface)] px-3 pt-2 pb-3">

      {/* Quick prompts */}
      {isEmpty && !isLoading && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {promptsRef.current.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              disabled={disabled}
              className="text-[11px] px-2.5 py-1 rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-soft)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              {prompt === "Help" && <HelpCircle size={10} />}
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isLoading ? "Waiting for response..." : placeholderRef.current}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 resize-none bg-[color:var(--bg,#f8fafc)] border border-[color:var(--border-soft)] rounded-xl px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)] transition-all disabled:opacity-50 leading-relaxed"
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />

        {isLoading ? (
          <button
            onClick={onCancel}
            title="Stop generating"
            className="w-9 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isEmpty || disabled}
            title="Send (Enter)"
            className="w-9 h-9 rounded-xl bg-[color:var(--primary)] hover:opacity-90 text-white flex items-center justify-center transition-opacity shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        )}
      </div>

      <p className="text-[10px] text-[color:var(--text-soft)] opacity-50 mt-1.5 text-center">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
};
