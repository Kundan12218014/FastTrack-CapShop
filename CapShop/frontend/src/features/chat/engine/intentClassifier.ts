/**
 * Intent Classifier
 *
 * Runs entirely client-side — no LLM round-trip for common intents.
 * Uses regex + keyword patterns to detect what the user wants.
 * Falls back to GENERAL_QA for anything that doesn't match.
 *
 * IMPORTANT ordering rule:
 *   Product/order intents are checked BEFORE help/greeting patterns.
 *   "hello, show me laptops" should search laptops, not show help.
 */

export type ChatIntent =
  | "PRODUCT_SEARCH"
  | "ORDER_TRACK"
  | "ADD_TO_CART"
  | "COMPARE_PRODUCTS"
  | "RATE_PRODUCT"
  | "CANCEL_ORDER"
  | "CART_VIEW"
  | "HELP"
  | "GENERAL_QA";

export interface ClassifiedIntent {
  intent: ChatIntent;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryHint?: string;
  matchedText?: string;
  confidence: number;
}

// ── Product search patterns ───────────────────────────────────────────────────

const PRODUCT_SEARCH_PATTERNS = [
  // explicit browse commands
  /\b(show|browse|explore|view|see|display).{0,20}\b(all\s+)?(products?|items?|catalog|catalogue)\b/i,
  // "show me / find me / get me / provide me"
  /\b(show me|find me|search for|get me|look for|provide me|give me|suggest me|recommend me)\b/i,
  // price constraints — any number after a price keyword
  /\b(under|below|less than|within|upto|up to|above|over|more than|between|from|range|around|approximately)\s*[₹Rs.]?\s*\d/i,
  // standalone category keywords (most important — catches "laptops", "mobiles", etc.)
  /\b(laptops?|notebooks?|mobiles?|smartphones?|phones?|books?|novels?|electronics?|fashion|clothing|sports?|beauty|kitchen|gadgets?|headphones?|earphones?|speakers?|cameras?|tablets?|watches?|shoes?|bags?)\b/i,
  // product type in a sentence
  /\b(provide|get|buy|want|need|looking for|searching for)\b.{0,50}\b(laptop|mobile|phone|book|shirt|shoes|watch|headphone|earphone|speaker|tv|camera|tablet|bag|dress|kurta|saree|cycle|bat|racket|mat|cooker|mixer|bulb|sunscreen|cream|serum|scrub|gel|product|item)\b/i,
  // quality adjectives before product types
  /\b(best|top|good|cheap|affordable|budget|premium|latest|new|popular|nice|great)\b.{0,40}\b(laptop|mobile|phone|book|product|item|watch|headphone|speaker|camera|tablet)\b/i,
  // recommendation requests
  /\b(recommend|suggest|what.{0,15}(good|best|popular|nice)|any good)\b/i,
];

const ORDER_TRACK_PATTERNS = [
  /\b(where|track|status|check).{0,20}\b(order|package|delivery|shipment)\b/i,
  /\b(my order|my orders|order history|past orders|recent orders)\b/i,
  /\b(when.{0,20}(deliver|arrive|come|ship))\b/i,
  /\border\s+#?[A-Z0-9-]+\b/i,
  /\b(delivery|shipped|dispatched|out for delivery)\b/i,
];

const ADD_TO_CART_PATTERNS = [
  /\b(add|put|place).{0,20}\b(cart|basket|bag)\b/i,
  /\b(add the (first|second|third|1st|2nd|3rd|last|this|that) one)\b/i,
  /\b(i want (to buy|this|that|the first|the second))\b/i,
  /\bbuy (this|that|it|the first|the second|the third)\b/i,
];

const COMPARE_PATTERNS = [
  /\b(compare|vs\.?|versus|difference between|which is better|which one)\b/i,
  /\b(better|worse|pros and cons|advantages|disadvantages)\b.{0,30}\b(vs|or|and)\b/i,
];

const RATE_PATTERNS = [
  /\b(rate|rating|review|feedback|stars?|give.{0,10}stars?)\b/i,
  /\b(write a review|leave a review|submit review)\b/i,
];

const CANCEL_PATTERNS = [
  /\b(cancel|return|refund|reject).{0,20}\b(order|purchase|item)\b/i,
  /\b(i want to cancel|cancel my order|cancel order)\b/i,
];

const CART_VIEW_PATTERNS = [
  /\b(my cart|view cart|show cart|what.{0,10}(in|inside).{0,10}cart|cart items?)\b/i,
  /\b(how many items? in (my )?cart|cart total|cart summary)\b/i,
];

// HELP only triggers when the message is PURELY a greeting/help request
// with NO product or order keywords present.
// "hello show me laptops" → PRODUCT_SEARCH (not HELP)
// "hello" → HELP
// "what can you do" → HELP
const HELP_PATTERNS = [
  // pure greetings — only if the whole message is just a greeting (short)
  /^(help|help me|hi|hello|hey|hii|helo|namaste|yo|sup)\s*[!?.]*$/i,
  // explicit capability questions
  /^(what can you do|what do you do|how do you work|what are you|who are you)\b/i,
  /\b(how (do|can|to)|what (is|are|can)|tell me about|explain|guide me)\b.{0,30}\b(capshop|this chatbot|this assistant|you do|you help)\b/i,
  /\b(your features?|your capabilities|your options|your commands|your instructions)\b/i,
];

// ── Noise words ───────────────────────────────────────────────────────────────
// Category names are included — they become categoryId filters, not text queries.
const NOISE_WORDS = new Set([
  // filler words
  "all",
  "products",
  "product",
  "items",
  "item",
  "things",
  "stuff",
  "something",
  "anything",
  "everything",
  "catalog",
  "catalogue",
  "try",
  "browse",
  "explore",
  "view",
  "see",
  "display",
  "show",
  "find",
  "search",
  "get",
  "buy",
  "want",
  "need",
  "me",
  "us",
  "please",
  "thanks",
  "thank",
  "you",
  "can",
  "could",
  "would",
  "a",
  "an",
  "the",
  "some",
  "any",
  "more",
  "other",
  "another",
  "also",
  "as",
  "well",
  "too",
  "just",
  "only",
  "even",
  "provide",
  "give",
  "suggest",
  "recommend",
  "good",
  "best",
  "top",
  "cheap",
  "affordable",
  "budget",
  "premium",
  "latest",
  "new",
  "popular",
  "nice",
  "great",
  // greetings that might prefix a real query
  "hello",
  "hi",
  "hey",
  "hii",
  "helo",
  "namaste",
  // category names — resolved via categoryId, not text search
  "electronics",
  "electronic",
  "mobiles",
  "mobile",
  "phones",
  "phone",
  "smartphones",
  "smartphone",
  "laptops",
  "laptop",
  "notebooks",
  "notebook",
  "books",
  "book",
  "novels",
  "novel",
  "fashion",
  "clothing",
  "clothes",
  "sports",
  "sport",
  "fitness",
  "beauty",
  "skincare",
  "kitchen",
  "appliances",
  "appliance",
  "gadgets",
  "gadget",
]);

// ── Price extractor ───────────────────────────────────────────────────────────

export interface PriceRange {
  minPrice?: number;
  maxPrice?: number;
}

export function extractPriceRange(text: string): PriceRange {
  const t = text.toLowerCase();

  // "between 2000 and 3000" / "from 2000 to 3000" / "2000-3000"
  const rangeMatch =
    t.match(
      /\b(?:between|from)\s*[₹rs.]?\s*([\d,]+)\s*(?:to|and|-)\s*[₹rs.]?\s*([\d,]+)/i,
    ) ?? t.match(/[₹rs.]?\s*([\d,]+)\s*(?:to|-)\s*[₹rs.]?\s*([\d,]+)/i);

  if (rangeMatch) {
    const a = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
    const b = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
    if (!isNaN(a) && !isNaN(b) && a > 0 && b > 0) {
      return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
    }
  }

  // "around / approximately / near 5000" — ±30%
  const aroundMatch = t.match(
    /\b(?:around|approximately|approx|near|about|roughly)\s*[₹rs.]?\s*([\d,]+)/i,
  );
  if (aroundMatch) {
    const val = parseInt(aroundMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0) {
      return {
        minPrice: Math.round(val * 0.7),
        maxPrice: Math.round(val * 1.3),
      };
    }
  }

  // "under / below / less than / upto 50000"
  const maxMatch = t.match(
    /\b(?:under|below|less than|within|upto|up to|max|maximum|not more than)\s*[₹rs.]?\s*([\d,]+)/i,
  );
  if (maxMatch) {
    const val = parseInt(maxMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0) return { maxPrice: val };
  }

  // "above / over / more than / minimum 10000"
  const minMatch = t.match(
    /\b(?:above|over|more than|greater than|min|minimum|at least|starting from|starts? at)\s*[₹rs.]?\s*([\d,]+)/i,
  );
  if (minMatch) {
    const val = parseInt(minMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0) return { minPrice: val };
  }

  return {};
}

// ── Category extractor ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string> = {
  laptop: "Laptops",
  laptops: "Laptops",
  notebook: "Laptops",
  notebooks: "Laptops",
  phone: "Mobiles",
  mobile: "Mobiles",
  smartphone: "Mobiles",
  mobiles: "Mobiles",
  phones: "Mobiles",
  smartphones: "Mobiles",
  book: "Books",
  books: "Books",
  novel: "Books",
  novels: "Books",
  shirt: "Fashion",
  dress: "Fashion",
  kurta: "Fashion",
  clothing: "Fashion",
  fashion: "Fashion",
  clothes: "Fashion",
  saree: "Fashion",
  jeans: "Fashion",
  electronics: "Electronics",
  gadget: "Electronics",
  gadgets: "Electronics",
  tv: "Electronics",
  television: "Electronics",
  speaker: "Electronics",
  headphone: "Electronics",
  earphone: "Electronics",
  camera: "Electronics",
  headphones: "Electronics",
  earphones: "Electronics",
  cameras: "Electronics",
  sport: "Sports",
  sports: "Sports",
  cricket: "Sports",
  football: "Sports",
  yoga: "Sports",
  badminton: "Sports",
  cycling: "Sports",
  fitness: "Sports",
  kitchen: "Home & Kitchen",
  cooker: "Home & Kitchen",
  mixer: "Home & Kitchen",
  appliance: "Home & Kitchen",
  appliances: "Home & Kitchen",
  beauty: "Beauty",
  skincare: "Beauty",
  sunscreen: "Beauty",
  cream: "Beauty",
  serum: "Beauty",
  scrub: "Beauty",
  shampoo: "Beauty",
  haircare: "Beauty",
};

export function extractCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return undefined;
}

// ── Search query extractor ────────────────────────────────────────────────────

function extractSearchQuery(text: string): string | undefined {
  let cleaned = text
    // strip greeting prefixes
    .replace(/^(hello|hi|hey|hii|helo|namaste|yo)\s*[,!.]?\s*/i, "")
    // strip explicit browse phrases
    .replace(/\b(show me all|browse all|see all|view all|explore all)\b/gi, "")
    .replace(
      /\b(show me|find me|search for|get me|look for|provide me|give me|suggest me|recommend me|i want|i need|looking for|searching for|buy|add to cart)\b/gi,
      "",
    )
    // strip price expressions
    .replace(
      /\b(?:between|from)\s*[₹rs.]?\s*[\d,]+\s*(?:to|and|-)\s*[₹rs.]?\s*[\d,]+/gi,
      "",
    )
    .replace(
      /\b(?:under|below|less than|within|upto|up to|above|over|more than|around|approximately|approx|near|about|roughly|max|maximum|min|minimum|at least|starting from|starts? at)\s*[₹rs.]?\s*[\d,]+/gi,
      "",
    )
    .replace(/[₹rs.]\s*[\d,]+/gi, "")
    // strip filler
    .replace(
      /\b(please|thanks|thank you|can you|could you|would you|as well|too|also|just|only|even|some|any|all|the|a|an)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  const meaningful = words.filter((w) => !NOISE_WORDS.has(w) && w.length > 1);

  if (meaningful.length === 0) return undefined;
  return meaningful.join(" ");
}

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyIntent(text: string): ClassifiedIntent {
  const t = text.trim();

  // Strip greeting prefix for pattern matching (but keep original for display)
  // "hello show me laptops" → test against "show me laptops"
  const tNoGreeting = t
    .replace(/^(hello|hi|hey|hii|helo|namaste|yo)\s*[,!.]?\s*/i, "")
    .trim();
  const tTest = tNoGreeting || t;

  // ORDER_TRACK — check early, high confidence
  if (ORDER_TRACK_PATTERNS.some((p) => p.test(tTest))) {
    return { intent: "ORDER_TRACK", confidence: 0.9, matchedText: t };
  }

  // CANCEL_ORDER
  if (CANCEL_PATTERNS.some((p) => p.test(tTest))) {
    return { intent: "CANCEL_ORDER", confidence: 0.9, matchedText: t };
  }

  // CART_VIEW
  if (CART_VIEW_PATTERNS.some((p) => p.test(tTest))) {
    return { intent: "CART_VIEW", confidence: 0.85, matchedText: t };
  }

  // ADD_TO_CART
  if (ADD_TO_CART_PATTERNS.some((p) => p.test(tTest))) {
    return { intent: "ADD_TO_CART", confidence: 0.85, matchedText: t };
  }

  // COMPARE_PRODUCTS
  if (COMPARE_PATTERNS.some((p) => p.test(tTest))) {
    return {
      intent: "COMPARE_PRODUCTS",
      confidence: 0.85,
      searchQuery: extractSearchQuery(t),
      matchedText: t,
    };
  }

  // RATE_PRODUCT
  if (RATE_PATTERNS.some((p) => p.test(tTest))) {
    return { intent: "RATE_PRODUCT", confidence: 0.85, matchedText: t };
  }

  // PRODUCT_SEARCH — check BEFORE help so "hello show me laptops" → search
  if (PRODUCT_SEARCH_PATTERNS.some((p) => p.test(tTest))) {
    const { minPrice, maxPrice } = extractPriceRange(t);
    return {
      intent: "PRODUCT_SEARCH",
      confidence: 0.8,
      searchQuery: extractSearchQuery(t),
      minPrice,
      maxPrice,
      categoryHint: extractCategory(t),
      matchedText: t,
    };
  }

  // HELP — only if message is purely a greeting/help request (no product/order content)
  if (HELP_PATTERNS.some((p) => p.test(t))) {
    return { intent: "HELP", confidence: 0.9, matchedText: t };
  }

  // GENERAL_QA — send to Ollama for natural language answers
  return { intent: "GENERAL_QA", confidence: 0.5, matchedText: t };
}
