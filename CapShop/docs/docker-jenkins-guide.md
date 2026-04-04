# CapShop Docker and Jenkins Guide

## Where each file belongs

- `docker-compose.yml` goes in the repository root because it wires the full stack together.
- `Jenkinsfile` goes in the repository root because Jenkins reads it from the repo root.
- `backend/Gateway/CapShop.Gateway/Dockerfile` builds the API gateway image.
- `backend/Services/AuthService/CapShop.AuthService/Dockerfile` builds the auth service image.
- `backend/Services/CatalogService/CapShop.CatalogService/Dockerfile` builds the catalog service image.
- `backend/Services/OrderService/CapShop.OrderService/Dockerfile` builds the order service image.
- `backend/Services/AdminService/CapShop.AdminService/Dockerfile` builds the admin service image.
- `frontend/Dockerfile` builds the production frontend image.
- `frontend/nginx.conf` lets the frontend container proxy `/gateway` requests to the gateway container.
- `backend/Gateway/CapShop.Gateway/ocelot.Docker.json` rewires gateway routes from `localhost` to Docker service names.

## How the flow works

1. The browser opens the frontend on `http://localhost:8080`.
2. Nginx serves the React build and forwards any `/gateway/*` request to the `gateway` container.
3. Ocelot in the gateway forwards each request to the correct backend service:
   - auth -> `auth-service`
   - catalog -> `catalog-service`
   - orders -> `order-service`
   - admin -> `admin-service`
4. The backend services use:
   - SQL Server container for the database
   - Redis container for caching
5. Jenkins runs tests, builds the frontend, builds Docker images, smoke-tests the stack, and can deploy it on the Jenkins host for the `main` branch.

## Step by step to run with Docker

1. Install Docker Desktop and make sure `docker compose version` works.
2. Set these environment variables on your machine or in Jenkins:
   - `SQL_SA_PASSWORD`
   - `AUTH_SMTP_EMAIL`
   - `AUTH_SMTP_PASSWORD`
   - Optional: `AUTH_SMTP_HOST`
   - Optional: `AUTH_SMTP_PORT`
3. From the repo root run:

```powershell
docker compose build
docker compose up -d
```

4. Check the running containers:

```powershell
docker compose ps
```

5. Open the app at `http://localhost:8080`.
6. Verify the gateway path is alive:

```powershell
Invoke-WebRequest http://localhost:5000/gateway/admin/health
```

7. Stop everything when needed:

```powershell
docker compose down
```

8. If you also want to clear SQL Server and Redis volumes:

```powershell
docker compose down -v
```

## Step by step to wire Jenkins

1. Install Jenkins on a machine that has:
   - Docker
   - Docker Compose
   - .NET SDK 10
   - Node.js 22
2. Install Jenkins plugins:
   - Pipeline
   - Git
   - Credentials Binding
3. In Jenkins create credentials with these IDs:
   - `capshop-sql-sa-password`
   - `capshop-smtp-email`
   - `capshop-smtp-password`
4. Create a Pipeline job pointing to this repository.
5. Tell Jenkins to use the root `Jenkinsfile`.
6. Run the pipeline.

## Jenkins stage flow

1. `Checkout` pulls the repository.
2. `Backend Tests` runs the .NET test projects.
3. `Frontend Build` runs `npm ci` and `npm run build`.
4. `Docker Build` builds every image from `docker-compose.yml`.
5. `Smoke Test Stack` starts the full stack, waits for startup, checks `http://localhost:5000/gateway/admin/health`, and then shuts the stack down.
6. `Deploy` runs only on the `main` branch and starts the stack in detached mode on the Jenkins server.

## Notes you should keep in mind

- Your current backend config files still point to local `SQLEXPRESS`; Docker overrides that with environment variables, so local non-Docker development still works.
- The services are running over HTTP inside Docker. That is intentional because container-to-container TLS adds extra certificate setup.
- The frontend should call `/gateway` in Docker. `frontend/nginx.conf` handles the proxying.
- The gateway needs a Docker-specific Ocelot file because `localhost` inside a container means "this same container", not "another service".
