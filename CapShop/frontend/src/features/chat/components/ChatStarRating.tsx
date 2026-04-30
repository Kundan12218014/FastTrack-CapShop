import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange?: (stars: number) => void;
  readonly?: boolean;
  size?: number;
}

/**
 * Interactive or read-only star rating component.
 * Supports hover preview when interactive.
 */
export const ChatStarRating = ({ value, onChange, readonly = false, size = 20 }: Props) => {
  const [hovered, setHovered] = useState(0);

  const display = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= display
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};
