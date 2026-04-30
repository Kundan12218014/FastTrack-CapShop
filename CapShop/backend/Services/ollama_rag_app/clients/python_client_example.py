import requests

BASE_URL = "http://127.0.0.1:8000"

# 1) Health check
health = requests.get(f"{BASE_URL}/api/health", timeout=30)
print("Health:", health.json())

# 2) Upload and index a text file
with open("sample_policy.txt", "rb") as file:
    upload = requests.post(
        f"{BASE_URL}/api/upload",
        files={"file": ("sample_policy.txt", file, "text/plain")},
        timeout=60,
    )
print("Upload:", upload.json())

# 3) Ask a question
response = requests.post(
    f"{BASE_URL}/api/ask",
    json={"question": "What is this document about?", "top_k": 4},
    timeout=180,
)
print("Answer:", response.json())
