FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/Services/AuthService/CapShop.AuthService/CapShop.AuthService.csproj", "backend/Services/AuthService/CapShop.AuthService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "backend/Services/AuthService/CapShop.AuthService/CapShop.AuthService.csproj"

COPY . .
WORKDIR "/src/backend/Services/AuthService/CapShop.AuthService"
RUN dotnet publish "CapShop.AuthService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.AuthService.dll"]
