FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["backend/Services/NotificationService/CapShop.NotificationService/CapShop.NotificationService.csproj", "backend/Services/NotificationService/CapShop.NotificationService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]
RUN dotnet restore "backend/Services/NotificationService/CapShop.NotificationService/CapShop.NotificationService.csproj"
COPY . .
WORKDIR "/src/backend/Services/NotificationService/CapShop.NotificationService"
RUN dotnet build "CapShop.NotificationService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CapShop.NotificationService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CapShop.NotificationService.dll"]