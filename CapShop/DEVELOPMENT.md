# CapShop — Local Development Guide

Everything you need to run CapShop on your machine, with or without Docker.

---

## Prerequisites

| Tool               | Version   | Download                                                               |
| ------------------ | --------- | ---------------------------------------------------------------------- |
| .NET SDK           | 10.x      | https://dotnet.microsoft.com/download                                  |
| Node.js            | 18+       | https://nodejs.org                                                     |
| Python             | 3.10+     | https://python.org (for AI chatbot)                                    |
| SQL Server Express | installed | Already on your machine as `.\SQLEXPRESS` (Windows auth)               |
| Docker Desktop     | any       | https://docker.com/products/docker-desktop (for Redis + RabbitMQ only) |
| Ollama             | any       | https://ollama.com (for AI chatbot)                                    |

---

## Option A — Local Development (recommended for coding)

Services run as native processes. Only SQL Server, Redis, and RabbitMQ run in Docker.

### Step 1 — One-time setup

```powershell
.\dev-setup.ps1
```

This will:

- Check all prerequisites
- Copy `.env.example` → `.env`
- Trust the .NET HTTPS dev certificate
- Restore NuGet packages
- Run `npm install` in `frontend/`
- Create a Python venv and install AI service requirements

**After setup, edit `.env`** and set real values for:

```
SQL_SA_PASSWORD=YourStrongPassword123!
JwtSettings__SecretKey=YourSecretKeyAtLeast32CharsLong!!
```

### Step 2 — Start infrastructure (SQL Server, Redis, RabbitMQ)

```powershell
.\dev-infra.ps1
```

Wait ~30 seconds for SQL Server to be ready on first run.

### Step 3 — Start Ollama (for AI chatbot)

In a separate terminal:

```powershell
ollama serve
```

Pull the model if you haven't already (one-time, ~800 MB):

```powershell
ollama pull llama3.2:1b
```

### Step 4 — Start all services

```powershell
.\dev-start.ps1
```

This opens separate terminal windows for each service, runs EF migrations automatically, and seeds data **once** (on first run only).

**Flags:**

- `.\dev-start.ps1 -SkipSeeder` — skip the data seeder entirely
- `.\dev-start.ps1 -ForceReseed` — wipe the `.capshop-seeded` flag and re-run the seeder
- `.\dev-start.ps1 -SkipAI` — skip Ollama + AI chatbot
- `.\dev-start.ps1 -SkipFrontend` — skip Vite dev server

**Seeding behavior:**

- On first run: seeder runs, creates `.capshop-seeded` flag file
- On subsequent runs: seeder is skipped (data already exists)
- To re-seed: delete `.capshop-seeded` or run with `-ForceReseed`

### Step 5 — Open the app

| URL                            | What                                 |
| ------------------------------ | ------------------------------------ |
| http://localhost:5173          | **React frontend** (main app)        |
| https://localhost:5000         | API Gateway (Ocelot)                 |
| https://localhost:5001/swagger | Auth Service API docs                |
| https://localhost:5002/swagger | Catalog Service API docs             |
| https://localhost:5003/swagger | Order Service API docs               |
| https://localhost:5004/swagger | Admin Service API docs               |
| https://localhost:7088/swagger | Notification Service API docs        |
| http://localhost:8001/docs     | AI Chatbot FastAPI docs              |
| http://localhost:15672         | RabbitMQ Management UI (guest/guest) |

### Stop everything

```powershell
.\dev-stop.ps1          # stops all services
.\dev-infra.ps1 -Stop   # stops SQL Server, Redis, RabbitMQ containers
```

---

## Option B — Full Docker (production-like)

Everything runs in containers. No local .NET/Python/Node needed.

### Start

```powershell
.\startup.ps1
# or
.\startup.bat
```

### Stop

```powershell
.\stop.ps1
# or
.\stop.bat
```

### URLs (Docker)

| URL                        | What                 |
| -------------------------- | -------------------- |
| http://localhost:8080      | Frontend (nginx)     |
| http://localhost:5000      | API Gateway          |
| http://localhost:5001      | Auth Service         |
| http://localhost:5002      | Catalog Service      |
| http://localhost:5003      | Order Service        |
| http://localhost:5004      | Admin Service        |
| http://localhost:5005      | Notification Service |
| http://localhost:8001/docs | AI Chatbot           |
| http://localhost:15672     | RabbitMQ UI          |

> **Ollama in Docker mode:** The AI service container connects to Ollama running on your host machine via `host.docker.internal:11434`. Make sure `ollama serve` is running before starting Docker.

---

## Port Reference

| Service      | Local (dev)            | Docker       |
| ------------ | ---------------------- | ------------ |
| Frontend     | 5173                   | 8080         |
| Gateway      | 5000 (https)           | 5000         |
| Auth         | 5001 (https)           | 5001         |
| Catalog      | 5002 (https)           | 5002         |
| Orders       | 5003 (https)           | 5003         |
| Admin        | 5004 (https)           | 5004         |
| Notification | 7088 (https)           | 5005         |
| AI Chatbot   | 8001                   | 8001         |
| SQL Server   | `.\SQLEXPRESS` (local) | 1433         |
| Redis        | 6379                   | 6379         |
| RabbitMQ     | 5672                   | 5672         |
| RabbitMQ UI  | 15672                  | 15672        |
| Ollama       | 11434                  | 11434 (host) |

---

## Running individual services manually

If you prefer to start services one at a time:

### Infrastructure only

```powershell
.\dev-infra.ps1
```

### A single .NET service

```powershell
cd backend/Services/AuthService/CapShop.AuthService
dotnet run --launch-profile https
```

### Gateway

```powershell
cd backend/Gateway/CapShop.Gateway
dotnet run --launch-profile https
```

### Frontend

```powershell
cd frontend
npm run dev
```

### AI Chatbot

```powershell
cd backend/Services/ollama_rag_app
.venv\Scripts\uvicorn fastapi_app:app --host 127.0.0.1 --port 8001 --reload
```

---

## Database migrations

Migrations run automatically in `dev-start.ps1`. To run them manually:

```powershell
# From the repo root
dotnet ef database update --project backend/Services/AuthService/CapShop.AuthService
dotnet ef database update --project backend/Services/CatalogService/CapShop.CatalogService
dotnet ef database update --project backend/Services/OrderService/CapShop.OrderService
dotnet ef database update --project backend/Services/AdminService/CapShop.AdminService
dotnet ef database update --project backend/Services/NotificationService/CapShop.NotificationService
```

To add a new migration:

```powershell
dotnet ef migrations add <MigrationName> --project backend/Services/AuthService/CapShop.AuthService
```

---

## Seeding data

The DataSeeder runs automatically in Docker (`dataseeder` container).

For local dev, run it manually after migrations:

```powershell
cd CapShop.DataSeeder
dotnet run
```

---

## Environment variables

All secrets live in `.env` at the repo root. Never commit this file.

| Variable                     | Used by                                   | Description                                    |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `SQL_SA_PASSWORD`            | Docker only                               | SQL Server SA password (not used in local dev) |
| `JwtSettings__SecretKey`     | Auth, Gateway, Order, Admin, Notification | JWT signing key (32+ chars)                    |
| `JwtSettings__Issuer`        | All                                       | Must be `CapShop.AuthService`                  |
| `JwtSettings__Audience`      | All                                       | Must be `CapShop.Client`                       |
| `AUTH_SMTP_EMAIL`            | Auth                                      | Email for 2FA / password reset                 |
| `AUTH_SMTP_PASSWORD`         | Auth                                      | SMTP password                                  |
| `NOTIFICATION_SMTP_EMAIL`    | Notification                              | Email for order notifications                  |
| `NOTIFICATION_SMTP_PASSWORD` | Notification                              | SMTP password                                  |
| `OLLAMA_URL`                 | AI Service                                | Ollama API URL                                 |
| `OLLAMA_MODEL`               | AI Service                                | Model name (default: `llama3.2:1b`)            |

For **local dev**, `.env` is only used by Docker. All .NET services read from `appsettings.Development.json` which uses `.\SQLEXPRESS` with Windows Integrated Security — no password needed.

---

## Troubleshooting

**`SSL connection error` or `certificate not trusted`**

```powershell
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

**`Cannot connect to SQL Server`**

- Your local `.\SQLEXPRESS` instance must be running
- Check in Services (`services.msc`) that `SQL Server (SQLEXPRESS)` is Started
- Or start it from PowerShell (run as Admin): `net start MSSQL$SQLEXPRESS`
- Connection uses Windows Integrated Security — no username/password needed
- The `appsettings.Development.json` files already point to `.\SQLEXPRESS`

**`Migration failed`**

- Ensure SQLEXPRESS is running and your Windows account has `db_owner` rights
- Run migrations manually: `dotnet ef database update --project backend/Services/AuthService/CapShop.AuthService`

**`AI chatbot shows offline`**

- Run `ollama serve` in a terminal
- Run `ollama pull llama3.2:1b` if the model isn't downloaded
- Check: `curl http://localhost:11434/api/tags`

**`RabbitMQ connection refused`**

- Run `dev-infra.ps1` to start it
- Services will still work but async events (order notifications, saga) won't fire

**`Port already in use`**

```powershell
# Find what's using a port (e.g. 5001)
netstat -ano | findstr :5001
# Kill it
taskkill /PID <pid> /F
```

**Frontend shows blank page or API errors**

- Make sure the Gateway is running on https://localhost:5000
- Check browser console for CORS or 401 errors
- Vite proxy config is in `frontend/vite.config.ts`
