FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/Services/OrderService/CapShop.OrderService/CapShop.OrderService.csproj", "backend/Services/OrderService/CapShop.OrderService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "backend/Services/OrderService/CapShop.OrderService/CapShop.OrderService.csproj"

COPY . .
WORKDIR "/src/backend/Services/OrderService/CapShop.OrderService"
RUN dotnet publish "CapShop.OrderService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.OrderService.dll"]
