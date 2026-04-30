import { X, Trash2, Bot, Wifi, WifiOff, Maximize2 } from "lucide-react";
import type { ChatMode } from "../engine/chatStateMachine";
import { MODE_LABELS, MODE_COLORS } from "../engine/chatStateMachine";

interface Props {
  onClose: () => void;
  onClear: () => void;
  isServiceAvailable: boolean | null;
  mode: ChatMode;
}

export const ChatHeader = ({ onClose, onClear, isServiceAvailable, mode }: Props) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border-soft)] bg-[color:var(--primary)] text-white rounded-t-2xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm leading-tight">CapShop Assistant</p>
            {/* Mode badge */}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${MODE_COLORS[mode]} leading-none`}>
              {MODE_LABELS[mode]}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isServiceAvailable === null ? (
              <span className="text-[10px] opacity-70">Connecting…</span>
            ) : isServiceAvailable ? (
              <>
                <Wifi size={10} className="opacity-80" />
                <span className="text-[10px] opacity-80">Online · Ollama llama3.2:1b</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="opacity-80" />
                <span className="text-[10px] opacity-80">AI offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onClear}
          title="Clear conversation"
          className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={onClose}
          title="Close chat"
          className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
