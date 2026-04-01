/**
 * Format a number as Indian Rupees.
 * Example: formatCurrency(12499) → "₹12,499"
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a UTC date string to a readable Indian date.
 * Example: formatDate("2024-03-15T10:30:00Z") → "15 Mar 2024"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a UTC date string to date + time.
 * Example: "15 Mar 2024, 4:30 PM"
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Truncate a string to a max length with ellipsis.
 * Example: truncate("Very long product name", 20) → "Very long product..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Calculate GST amount.
 * Example: calculateGst(1000, 18) → 180
 */
export function calculateGst(amount: number, rate = 18): number {
  return Math.round((amount * rate) / 100);
}

/**
 * Format a number in shortened form.
 * Example: formatShortNumber(1500000) → "15.0L"
 */
export function formatShortNumber(num: number): string {
  if (num >= 10_000_000) return `${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

/**
 * Generate ETA date from order placed date.
 * Default: 5 business days.
 */
export function calculateEta(placedAt: string, businessDays = 5): Date {
  const date = new Date(placedAt);
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++; // skip Sunday (0) and Saturday (6)
  }
  return date;
}
