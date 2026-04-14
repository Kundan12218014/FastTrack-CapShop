# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore only what's needed (using .csproj files for layer caching)
COPY ["CapShop.DataSeeder/CapShop.DataSeeder.csproj", "CapShop.DataSeeder/"]
COPY ["backend/Services/AuthService/CapShop.AuthService/CapShop.AuthService.csproj",      "backend/Services/AuthService/CapShop.AuthService/"]
COPY ["backend/Services/CatalogService/CapShop.CatalogService/CapShop.CatalogService.csproj", "backend/Services/CatalogService/CapShop.CatalogService/"]
COPY ["backend/Services/OrderService/CapShop.OrderService/CapShop.OrderService.csproj",   "backend/Services/OrderService/CapShop.OrderService/"]
COPY ["backend/Services/AdminService/CapShop.AdminService/CapShop.AdminService.csproj",   "backend/Services/AdminService/CapShop.AdminService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj",                              "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "CapShop.DataSeeder/CapShop.DataSeeder.csproj"

# Copy full source and build
COPY . .
WORKDIR /src/CapShop.DataSeeder
RUN dotnet publish "CapShop.DataSeeder.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ─── Runtime Stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.DataSeeder.dll"]
