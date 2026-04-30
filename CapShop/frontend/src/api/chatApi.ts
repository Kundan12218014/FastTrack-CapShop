/**
 * CapShop AI Chatbot API
 *
 * Communicates directly with the FastAPI RAG service via the /ai proxy.
 * Uses a plain fetch (not axiosClient) because:
 *   1. The RAG service is not behind the Ocelot gateway — it has its own proxy path.
 *   2. Streaming (SSE) requires the native fetch API; Axios does not support SSE natively.
 */

import { API } from "../constants/apiEndpoints";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatSource {
  filename: string;
  chunk_no: number;
  text: string;
  score: number;
}

export interface AiHealthResponse {
  status: string;
  model: string;
  ollama_url: string;
  documents: number;
  chunks: number;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  stored_name: string;
  chunk_count: number;
}

// ── Base URL ──────────────────────────────────────────────────────────────────
// In dev: Vite proxies /ai → http://localhost:8001
// In Docker: nginx proxies /ai → http://ai-service:8000
const AI_BASE = "";

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkAiHealth(): Promise<AiHealthResponse> {
  const res = await fetch(`${AI_BASE}${API.AI.HEALTH}`);
  if (!res.ok) throw new Error(`AI service health check failed: ${res.status}`);
  return res.json();
}

// ── Non-streaming ask ─────────────────────────────────────────────────────────

export async function askAi(
  question: string,
  history: ChatMessage[] = [],
  topK = 4,
): Promise<AskResponse> {
  const res = await fetch(`${AI_BASE}${API.AI.ASK}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history, top_k: topK }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `AI request failed: ${res.status}`);
  }

  return res.json();
}

// ── Streaming ask (SSE) ───────────────────────────────────────────────────────

export interface StreamCallbacks {
  /** Called with each token as it arrives */
  onToken: (token: string) => void;
  /** Called once with the retrieved sources (sent before tokens) */
  onSources: (sources: ChatSource[]) => void;
  /** Called when the stream completes successfully */
  onDone: () => void;
  /** Called if an error occurs */
  onError: (message: string) => void;
}

/**
 * Opens an SSE stream to the AI service and calls the provided callbacks.
 * Returns an AbortController so the caller can cancel mid-stream.
 */
export function askAiStream(
  question: string,
  history: ChatMessage[],
  callbacks: StreamCallbacks,
  topK = 4,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${AI_BASE}${API.AI.ASK_STREAM}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, top_k: topK }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        callbacks.onError(err.detail ?? `AI request failed: ${res.status}`);
        return;
      }

      if (!res.body) {
        callbacks.onError("No response body from AI service.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by double newlines
        const parts = buffer.split("\n\n");
        // Keep the last (potentially incomplete) part in the buffer
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          let eventType = "message";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataLine = line.slice(6);
            }
          }

          if (!dataLine) continue;

          if (eventType === "sources") {
            try {
              const sources: ChatSource[] = JSON.parse(dataLine);
              callbacks.onSources(sources);
            } catch {
              // ignore malformed sources
            }
            continue;
          }

          // Default message event
          if (dataLine === "[DONE]") {
            callbacks.onDone();
            return;
          }

          if (dataLine.startsWith("[ERROR]")) {
            callbacks.onError(dataLine.slice(7).trim());
            return;
          }

          // Unescape newlines that were escaped for SSE transport
          const token = dataLine.replace(/\\n/g, "\n");
          callbacks.onToken(token);
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — not an error
        return;
      }
      callbacks.onError(
        err instanceof Error
          ? err.message
          : "Unexpected error connecting to AI service.",
      );
    }
  })();

  return controller;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getAiDocuments(): Promise<UploadedDocument[]> {
  const res = await fetch(`${AI_BASE}${API.AI.DOCUMENTS}`);
  if (!res.ok) throw new Error("Failed to fetch AI documents.");
  return res.json();
}

export async function uploadAiDocument(file: File): Promise<{
  message: string;
  filename: string;
  chunks: number;
}> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${AI_BASE}${API.AI.UPLOAD}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}
