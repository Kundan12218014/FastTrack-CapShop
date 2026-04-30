ollama run llama3.2:1bfrom __future__ import annotations

import json
import math
import re
import uuid
from collections import Counter
from pathlib import Path
from typing import List, Dict

import requests
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
INDEX_FILE = DATA_DIR / "index.json"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
GENERATION_MODEL = "llama3.2:1b"
ALLOWED_EXTENSIONS = {"txt", "md"}
MAX_CHUNK_CHARS = 900
OVERLAP_CHARS = 120
TOP_K = 4

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are", "was", "were",
    "be", "by", "as", "at", "that", "this", "it", "from", "but", "not", "can", "you", "your", "i",
    "we", "they", "he", "she", "them", "his", "her", "our", "their", "have", "has", "had", "will",
    "would", "should", "could", "about", "into", "than", "then", "so", "if", "when", "what", "which",
    "who", "how", "why", "do", "does", "did", "been", "being", "there", "here", "also", "all", "any"
}


def load_index() -> Dict:
    if INDEX_FILE.exists():
        return json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    return {"documents": [], "chunks": []}


def save_index(index: Dict) -> None:
    INDEX_FILE.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")


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
    chunks = []
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

    # fallback for very short single-line docs
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


def retrieve_context(question: str, top_k: int = TOP_K) -> List[Dict]:
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
        # small bonus for direct substring matches
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


def ask_ollama(question: str, contexts: List[Dict]) -> str:
    context_text = "\n\n".join(
        [f"[Source: {c['filename']} | Chunk {c['chunk_no']}]\n{c['text']}" for c in contexts]
    )

    if context_text:
        prompt = f"""You are a helpful assistant answering questions only from the provided documents.
If the answer is not found in the context, say: "I could not find that in the uploaded documents."
Cite source filenames in a short 'Sources:' line at the end.

Context:
{context_text}

Question:
{question}

Answer:"""
    else:
        prompt = f"""You are a helpful assistant.
No document context is available.
Tell the user to upload a .txt or .md file first.

Question:
{question}

Answer:"""

    payload = {
        "model": GENERATION_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 400,
        },
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()
    return data.get("response", "No response from Ollama.").strip()


@app.route("/")
def index():
    stored_index = load_index()
    return render_template("index.html", documents=stored_index["documents"], model_name=GENERATION_MODEL)


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only .txt and .md files are allowed."}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path = UPLOAD_DIR / unique_name
    file.save(save_path)

    chunk_count = index_document(save_path, filename)
    return jsonify({
        "message": f"Uploaded and indexed '{filename}' successfully.",
        "filename": filename,
        "chunks": chunk_count,
    })


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Question is required."}), 400

    contexts = retrieve_context(question, top_k=TOP_K)
    try:
        answer = ask_ollama(question, contexts)
    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Could not connect to Ollama. Please start Ollama and make sure the model is available."
        }), 500
    except requests.exceptions.RequestException as exc:
        return jsonify({"error": f"Ollama request failed: {str(exc)}"}), 500

    return jsonify({"answer": answer, "sources": contexts})


@app.route("/documents")
def documents():
    stored_index = load_index()
    return jsonify(stored_index["documents"])


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": GENERATION_MODEL})


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
