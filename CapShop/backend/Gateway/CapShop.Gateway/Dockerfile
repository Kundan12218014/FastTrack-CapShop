FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/Gateway/CapShop.Gateway/CapShop.Gateway.csproj", "backend/Gateway/CapShop.Gateway/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "backend/Gateway/CapShop.Gateway/CapShop.Gateway.csproj"

COPY . .
WORKDIR "/src/backend/Gateway/CapShop.Gateway"
RUN dotnet publish "CapShop.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.Gateway.dll"]
