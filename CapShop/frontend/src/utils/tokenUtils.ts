import { useAuthStore } from "../store/authStore";

/**
 * Decode JWT payload without a library.
 * JWT is three base64url segments — payload is the middle one.
 * Used to check expiry before making API calls.
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    // base64url → base64 → decode
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(
      padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the stored JWT is expired or missing.
 * Used in axiosClient request interceptor to detect stale tokens.
 */
export function isTokenExpired(): boolean {
  const token = useAuthStore.getState().token;
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;

  // exp is Unix seconds — compare with current time + 30s buffer
  return payload.exp * 1000 < Date.now() + 30_000;
}

/**
 * Extract a claim value from the stored JWT.
 * Example: getTokenClaim("role") → "Customer"
 */
export function getTokenClaim(claimName: string): string | null {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return typeof payload[claimName] === "string"
    ? (payload[claimName] as string)
    : null;
}
