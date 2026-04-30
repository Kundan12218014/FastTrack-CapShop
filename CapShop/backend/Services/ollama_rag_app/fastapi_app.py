from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import AsyncGenerator, List, Optional

import requests
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from starlette.requests import Request


def secure_filename(filename: str) -> str:
    filename = filename.strip().replace("\\", "/").split("/")[-1]
    filename = re.sub(r"[^A-Za-z0-9_.-]", "_", filename)
    return filename or "uploaded_file"


from rag_core import (
    DEFAULT_TOP_K,
    GENERATION_MODEL,
    UPLOAD_DIR,
    allowed_file,
    ask_ollama,
    ask_ollama_stream,
    health_payload,
    index_document,
    load_index,
    reset_index,
    retrieve_context,
)

app = FastAPI(
    title="CapShop AI Assistant — RAG Service",
    description=(
        "Local RAG + Ollama service powering the CapShop AI chatbot. "
        "Supports streaming responses, conversation history, and document-grounded answers."
    ),
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the React dev server (5173) and the production nginx container (8080).
# In production, tighten this to your actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


# ── Request / Response models ─────────────────────────────────────────────────

class HistoryMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The user's question")
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=10)
    model: Optional[str] = Field(default=None, description="Ollama model override")
    history: Optional[List[HistoryMessage]] = Field(
        default=None,
        description="Previous conversation turns for multi-turn context",
    )


class AskResponse(BaseModel):
    answer: str
    sources: List[dict]


class StreamAskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=10)
    model: Optional[str] = None
    history: Optional[List[HistoryMessage]] = None


# ── UI ────────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse, tags=["UI"])
async def home(request: Request):
    stored_index = load_index()
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "documents": stored_index["documents"], "model_name": GENERATION_MODEL},
    )


# ── System ────────────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["System"])
async def api_health():
    return health_payload()


@app.get("/health", tags=["System"])
async def health():
    return health_payload()


# ── Documents ─────────────────────────────────────────────────────────────────

@app.post("/api/upload", tags=["Documents"])
async def api_upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Only .txt and .md files are allowed.")

    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path = UPLOAD_DIR / unique_name

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    save_path.write_bytes(content)
    chunk_count = index_document(save_path, filename)

    return {
        "message": f"Uploaded and indexed '{filename}' successfully.",
        "filename": filename,
        "stored_name": unique_name,
        "chunks": chunk_count,
    }


# Backward-compatible route
@app.post("/upload", tags=["Documents"])
async def upload_file(file: UploadFile = File(...)):
    return await api_upload_file(file)


@app.get("/api/documents", tags=["Documents"])
async def api_documents():
    return load_index()["documents"]


@app.get("/documents", tags=["Documents"])
async def documents():
    return load_index()["documents"]


# ── RAG ───────────────────────────────────────────────────────────────────────

@app.get("/api/retrieve", tags=["RAG"])
async def api_retrieve(
    question: str = Query(..., min_length=1),
    top_k: int = Query(DEFAULT_TOP_K, ge=1, le=10),
):
    return {"question": question, "sources": retrieve_context(question, top_k=top_k)}


@app.post("/api/ask", response_model=AskResponse, tags=["RAG"])
async def api_ask(payload: AskRequest):
    """Non-streaming ask. Returns the full answer once Ollama finishes."""
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    contexts = retrieve_context(question, top_k=payload.top_k)
    history = [m.model_dump() for m in payload.history] if payload.history else None

    try:
        answer = ask_ollama(question, contexts, model=payload.model, history=history)
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama. Start Ollama and make sure the model is available.",
        )
    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Ollama request failed: {str(exc)}")

    return {"answer": answer, "sources": contexts}


# Backward-compatible route
@app.post("/ask", tags=["RAG"])
async def ask(payload: AskRequest):
    return await api_ask(payload)


@app.post("/api/ask/stream", tags=["RAG"])
async def api_ask_stream(payload: StreamAskRequest):
    """
    Streaming ask using Server-Sent Events (SSE).

    The response is a text/event-stream where each event is:
      data: <token>\\n\\n

    A final event signals completion:
      data: [DONE]\\n\\n

    On error before streaming starts, returns a normal JSON 4xx/5xx.
    On error mid-stream, sends:
      data: [ERROR] <message>\\n\\n
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    contexts = retrieve_context(question, top_k=payload.top_k)
    history = [m.model_dump() for m in payload.history] if payload.history else None

    # Validate Ollama is reachable before opening the stream
    try:
        import requests as _req
        _req.get(
            GENERATION_MODEL and "http://127.0.0.1:11434" or "http://127.0.0.1:11434",
            timeout=3,
        )
    except Exception:
        # Ollama might still work even if the root ping fails; let the stream attempt handle it
        pass

    async def event_generator() -> AsyncGenerator[str, None]:
        # First, send the sources as a special event so the frontend can display them
        import json as _json
        sources_payload = _json.dumps(contexts)
        yield f"event: sources\ndata: {sources_payload}\n\n"

        try:
            for token in ask_ollama_stream(question, contexts, model=payload.model, history=history):
                if token:
                    # Escape newlines inside the SSE data field
                    safe_token = token.replace("\n", "\\n")
                    yield f"data: {safe_token}\n\n"
        except requests.exceptions.ConnectionError:
            yield "data: [ERROR] Could not connect to Ollama. Please make sure Ollama is running.\n\n"
        except requests.exceptions.RequestException as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering for SSE
        },
    )


# ── Admin ─────────────────────────────────────────────────────────────────────

@app.delete("/api/reset", tags=["Admin"])
async def api_reset(delete_uploads: bool = Query(False)):
    reset_index(delete_uploads=delete_uploads)
    return {"message": "Index reset successfully.", "delete_uploads": delete_uploads}
