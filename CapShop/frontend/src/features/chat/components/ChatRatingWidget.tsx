import { useState } from "react";
import { Send } from "lucide-react";
import { ChatStarRating } from "./ChatStarRating";
import { useChat } from "../hooks/useChat";

interface Props {
  productId: string;
  productName: string;
}

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

/**
 * Inline rating widget rendered inside a chat bubble.
 * Lets the user pick 1–5 stars and optionally write a review.
 */
export const ChatRatingWidget = ({ productId, productName }: Props) => {
  const { submitProductRating } = useChat();
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    await submitProductRating(productId, stars, review.trim() || undefined);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold py-1">
        <span className="text-lg">🎉</span>
        Thanks for your {stars}-star rating!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[color:var(--text)]">
        Rate: <span className="text-[color:var(--primary)]">{productName}</span>
      </p>

      <div className="flex items-center gap-3">
        <ChatStarRating value={stars} onChange={setStars} size={24} />
        {stars > 0 && (
          <span className="text-sm font-medium text-amber-600">
            {STAR_LABELS[stars]}
          </span>
        )}
      </div>

      {stars > 0 && (
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write a review (optional)…"
          rows={2}
          maxLength={500}
          className="w-full text-sm resize-none bg-[color:var(--bg,#f8fafc)] border border-[color:var(--border-soft)] rounded-xl px-3 py-2 text-[color:var(--text)] placeholder:text-[color:var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)] transition-all"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={stars === 0 || submitting}
        className="flex items-center gap-2 px-4 py-2 bg-[color:var(--primary)] text-white text-sm font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        <Send size={14} />
        {submitting ? "Submitting…" : "Submit Rating"}
      </button>
    </div>
  );
};
