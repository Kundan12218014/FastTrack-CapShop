# Ollama RAG FastAPI Service

This project now includes a **FastAPI service layer** so other projects can call the RAG chatbot through HTTP APIs.

The original Flask app is still available in `app.py`, but the recommended API service is:

```text
fastapi_app.py
```

## Project structure

```text
ollama_rag_app/
│-- app.py                      # Existing Flask app
│-- fastapi_app.py              # New FastAPI API service
│-- rag_core.py                 # Shared RAG + Ollama logic
│-- run_fastapi.py              # FastAPI runner
│-- requirements.txt
│-- README.md
│-- README_FASTAPI.md
│-- sample_policy.txt
│-- clients/
│   │-- python_client_example.py
│   └-- dotnet_httpclient_example.cs
│-- templates/
│   └-- index.html
│-- static/
│   ├-- styles.css
│   └-- script.js
│-- uploads/
└-- data/
```

## Requirements

Install and run Ollama first.

Check model:

```bash
ollama list
```

Required model by default:

```bash
ollama run llama3.2:1b
```

You can change the model using environment variable:

```bash
set OLLAMA_MODEL=llama3.2:1b
```

For PowerShell:

```powershell
$env:OLLAMA_MODEL="llama3.2:1b"
```

## Setup on Windows

Open terminal inside the project folder:

```bash
py -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run FastAPI

Option 1:

```bash
python run_fastapi.py
```

Option 2:

```bash
uvicorn fastapi_app:app --host 127.0.0.1 --port 8000 --reload
```

Open Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Open UI:

```text
http://127.0.0.1:8000/
```

## API endpoints

### 1. Health check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "model": "llama3.2:1b",
  "ollama_url": "http://127.0.0.1:11434/api/generate",
  "documents": 1,
  "chunks": 2
}
```

### 2. Upload document

```http
POST /api/upload
Content-Type: multipart/form-data
```

Form field name:

```text
file
```

Allowed files:

```text
.txt, .md
```

cURL example:

```bash
curl -X POST "http://127.0.0.1:8000/api/upload" -F "file=@sample_policy.txt"
```

### 3. Ask question

```http
POST /api/ask
Content-Type: application/json
```

Request:

```json
{
  "question": "How many annual leave days are allowed?",
  "top_k": 4
}
```

Response:

```json
{
  "answer": "Employees are eligible for 18 annual leave days per calendar year.\n\nSources: sample_policy.txt",
  "sources": [
    {
      "filename": "sample_policy.txt",
      "chunk_no": 1,
      "text": "...",
      "score": 0.5123
    }
  ]
}
```

### 4. List indexed documents

```http
GET /api/documents
```

### 5. Retrieve matching chunks only

```http
GET /api/retrieve?question=leave policy&top_k=4
```

### 6. Reset index

```http
DELETE /api/reset
```

Delete index and uploaded files:

```http
DELETE /api/reset?delete_uploads=true
```

## Backward-compatible routes

The following old routes are also supported, so the existing HTML/JavaScript UI can continue working:

```text
GET  /health
POST /upload
POST /ask
GET  /documents
```

## Calling from another Python project

```python
import requests

BASE_URL = "http://127.0.0.1:8000"

response = requests.post(
    f"{BASE_URL}/api/ask",
    json={"question": "What is the leave policy?", "top_k": 4},
    timeout=180,
)

print(response.json())
```

## Calling from a .NET project

```csharp
using System.Text;

var baseUrl = "http://127.0.0.1:8000";
using var client = new HttpClient();

var json = """
{
  "question": "What is the leave policy?",
  "top_k": 4
}
""";

var content = new StringContent(json, Encoding.UTF8, "application/json");
var response = await client.PostAsync($"{baseUrl}/api/ask", content);
var result = await response.Content.ReadAsStringAsync();

Console.WriteLine(result);
```

## Notes for production

Before deploying to production:

1. Restrict CORS origins instead of using `*`.
2. Add API key or JWT authentication.
3. Add upload size validation based on your requirement.
4. Use HTTPS.
5. Move data/index storage to a database or vector database for larger projects.
6. Use ChromaDB, FAISS, PostgreSQL pgvector, or Azure AI Search for stronger retrieval.
