from __future__ import annotations

import json
import math
import os
import re
import uuid
from collections import Counter
from pathlib import Path
from typing import Dict, Generator, List, Optional

import requests

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
INDEX_FILE = DATA_DIR / "index.json"

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
GENERATION_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

ALLOWED_EXTENSIONS = {"txt", "md"}
MAX_CHUNK_CHARS = int(os.getenv("MAX_CHUNK_CHARS", "900"))
OVERLAP_CHARS = int(os.getenv("OVERLAP_CHARS", "120"))
DEFAULT_TOP_K = int(os.getenv("TOP_K", "4"))

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are", "was", "were",
    "be", "by", "as", "at", "that", "this", "it", "from", "but", "not", "can", "you", "your", "i",
    "we", "they", "he", "she", "them", "his", "her", "our", "their", "have", "has", "had", "will",
    "would", "should", "could", "about", "into", "than", "then", "so", "if", "when", "what", "which",
    "who", "how", "why", "do", "does", "did", "been", "being", "there", "here", "also", "all", "any"
}

# ── CapShop system context injected into every prompt ──────────────────────────
CAPSHOP_SYSTEM_CONTEXT = """You are CapShop Assistant, a friendly and knowledgeable AI helper for CapShop — an Indian e-commerce platform.

You help customers with:
- Finding products, checking availability, and understanding pricing
- Tracking orders and understanding order statuses (Draft, CheckoutStarted, PaymentPending, Paid, Packed, Shipped, Delivered, Cancelled, PaymentFailed)
- Understanding the checkout and payment process (we support simulated payment methods)
- Account management: registration, login, two-factor authentication (Email or Authenticator app), password reset
- Cart management: adding items, updating quantities, removing items
- Shipping information: we offer free shipping on all orders
- Returns and cancellations: orders in Paid, PaymentPending, or Packed status can be cancelled
- General shopping guidance and product recommendations

CapShop platform details:
- Built with .NET 10 microservices (Auth, Catalog, Order, Admin, Notification services)
- Secure JWT authentication with optional 2FA
- Real-time order notifications via email
- Products span categories: Electronics, Mobiles, Laptops, Clothing, Home & Kitchen, Books, Sports, Fashion
- Prices are in Indian Rupees (₹)
- Admin users can manage products, view orders, and access sales reports

Tone: Be warm, concise, and helpful. Use simple language. If you don't know something specific about a user's order or account, guide them to the relevant section of the app.
"""


def load_index() -> Dict:
    if INDEX_FILE.exists():
        return json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    return {"documents": [], "chunks": []}


def save_index(index: Dict) -> None:
    INDEX_FILE.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


def reset_index(delete_uploads: bool = False) -> None:
    save_index({"documents": [], "chunks": []})
    if delete_uploads:
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file():
                file_path.unlink(missing_ok=True)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> List[str]:
    words = re.findall(r"[a-zA-Z0-9_]+", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]


def split_into_chunks(text: str, max_chars: int = MAX_CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> List[str]:
    text = text.replace("\r\n", "\n")
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= max_chars:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            if len(para) <= max_chars:
                current = para
            else:
                start = 0
                while start < len(para):
                    end = start + max_chars
                    piece = para[start:end].strip()
                    if piece:
                        chunks.append(piece)
                    start = max(end - overlap, end)
                current = ""
    if current:
        chunks.append(current)

    if not chunks and text.strip():
        text = text.strip()
        for i in range(0, len(text), max_chars):
            chunks.append(text[i:i + max_chars])

    return chunks


def build_chunk_record(doc_id: str, filename: str, chunk_text: str, chunk_no: int) -> Dict:
    tokens = tokenize(chunk_text)
    token_counts = Counter(tokens)
    norm = math.sqrt(sum(v * v for v in token_counts.values())) or 1.0
    return {
        "id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "filename": filename,
        "chunk_no": chunk_no,
        "text": chunk_text,
        "token_counts": dict(token_counts),
        "norm": norm,
    }


def index_document(file_path: Path, original_name: str) -> int:
    raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
    clean_text = normalize_text(raw_text)
    chunks = split_into_chunks(clean_text)

    index = load_index()
    doc_id = str(uuid.uuid4())
    index["documents"].append({
        "id": doc_id,
        "filename": original_name,
        "stored_name": file_path.name,
        "chunk_count": len(chunks),
    })

    for idx, chunk in enumerate(chunks, start=1):
        index["chunks"].append(build_chunk_record(doc_id, original_name, chunk, idx))

    save_index(index)
    return len(chunks)


def cosine_similarity(query_counts: Counter, query_norm: float, chunk: Dict) -> float:
    dot = 0.0
    chunk_counts = chunk["token_counts"]
    for token, q_count in query_counts.items():
        dot += q_count * chunk_counts.get(token, 0)
    return dot / ((query_norm or 1.0) * (chunk["norm"] or 1.0))


def retrieve_context(question: str, top_k: int = DEFAULT_TOP_K) -> List[Dict]:
    index = load_index()
    if not index["chunks"]:
        return []

    q_tokens = tokenize(question)
    if not q_tokens:
        return []

    q_counts = Counter(q_tokens)
    q_norm = math.sqrt(sum(v * v for v in q_counts.values())) or 1.0

    scored = []
    for chunk in index["chunks"]:
        score = cosine_similarity(q_counts, q_norm, chunk)
        if any(token in chunk["text"].lower() for token in q_tokens):
            score += 0.05
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {
            "filename": item[1]["filename"],
            "chunk_no": item[1]["chunk_no"],
            "text": item[1]["text"],
            "score": round(item[0], 4),
        }
        for item in scored[:top_k]
    ]


def build_prompt(
    question: str,
    contexts: List[Dict],
    history: Optional[List[Dict]] = None,
) -> str:
    """
    Build the full prompt string combining:
    - CapShop system context
    - Optional RAG document context
    - Conversation history (last N turns)
    - Current question
    """
    parts: List[str] = [CAPSHOP_SYSTEM_CONTEXT]

    # RAG document context (if any documents are indexed)
    if contexts:
        context_text = "\n\n".join(
            f"[Source: {c['filename']} | Chunk {c['chunk_no']}]\n{c['text']}"
            for c in contexts
        )
        parts.append(
            "Additional context from uploaded documents:\n"
            + context_text
            + "\n\nIf the answer is in the documents above, cite the source filename."
        )

    # Conversation history (last 6 turns to keep prompt size manageable)
    if history:
        recent = history[-6:]
        history_lines = []
        for turn in recent:
            role = turn.get("role", "user")
            content = turn.get("content", "").strip()
            if role == "user":
                history_lines.append(f"Customer: {content}")
            else:
                history_lines.append(f"Assistant: {content}")
        if history_lines:
            parts.append("Conversation so far:\n" + "\n".join(history_lines))

    parts.append(f"Customer: {question}\nAssistant:")
    return "\n\n".join(parts)


def ask_ollama(
    question: str,
    contexts: List[Dict],
    model: Optional[str] = None,
    history: Optional[List[Dict]] = None,
) -> str:
    """Non-streaming ask — returns the full answer string."""
    model_name = model or GENERATION_MODEL
    prompt = build_prompt(question, contexts, history)

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 512,
        },
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "No response from Ollama.").strip()


def ask_ollama_stream(
    question: str,
    contexts: List[Dict],
    model: Optional[str] = None,
    history: Optional[List[Dict]] = None,
) -> Generator[str, None, None]:
    """
    Streaming ask — yields token strings as they arrive from Ollama.
    Each yielded value is a raw token string (may be empty string at end).
    """
    model_name = model or GENERATION_MODEL
    prompt = build_prompt(question, contexts, history)

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.3,
            "num_predict": 512,
        },
    }

    with requests.post(OLLAMA_URL, json=payload, stream=True, timeout=120) as resp:
        resp.raise_for_status()
        for raw_line in resp.iter_lines():
            if not raw_line:
                continue
            try:
                chunk = json.loads(raw_line)
            except json.JSONDecodeError:
                continue
            token = chunk.get("response", "")
            yield token
            if chunk.get("done", False):
                break


def health_payload() -> Dict:
    index = load_index()
    return {
        "status": "ok",
        "model": GENERATION_MODEL,
        "ollama_url": OLLAMA_URL,
        "documents": len(index.get("documents", [])),
        "chunks": len(index.get("chunks", [])),
    }
