FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/Services/CatalogService/CapShop.CatalogService/CapShop.CatalogService.csproj", "backend/Services/CatalogService/CapShop.CatalogService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "backend/Services/CatalogService/CapShop.CatalogService/CapShop.CatalogService.csproj"

COPY . .
WORKDIR "/src/backend/Services/CatalogService/CapShop.CatalogService"
RUN dotnet publish "CapShop.CatalogService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.CatalogService.dll"]
