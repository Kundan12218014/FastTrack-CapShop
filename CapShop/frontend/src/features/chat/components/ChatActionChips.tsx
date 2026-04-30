import type { ActionChip } from "../store/chatStore";

interface Props {
  chips: ActionChip[];
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Contextual action chips rendered below an assistant message.
 * Clicking a chip sends its message as if the user typed it.
 */
export const ChatActionChips = ({ chips, onSend, disabled }: Props) => {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSend(chip.message)}
          disabled={disabled}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[color:var(--primary)]/40 text-[color:var(--primary)] font-semibold hover:bg-[color:var(--primary)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};
