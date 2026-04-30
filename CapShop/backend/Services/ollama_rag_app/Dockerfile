FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer cache)
COPY backend/Services/ollama_rag_app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY backend/Services/ollama_rag_app/ .

# Ensure data and uploads directories exist
RUN mkdir -p data uploads

EXPOSE 8000

CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
