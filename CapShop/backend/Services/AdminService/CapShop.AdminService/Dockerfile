FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend/Services/AdminService/CapShop.AdminService/CapShop.AdminService.csproj", "backend/Services/AdminService/CapShop.AdminService/"]
COPY ["backend/Shared/CapShop.Shared/CapShop.Shared.csproj", "backend/Shared/CapShop.Shared/"]

RUN dotnet restore "backend/Services/AdminService/CapShop.AdminService/CapShop.AdminService.csproj"

COPY . .
WORKDIR "/src/backend/Services/AdminService/CapShop.AdminService"
RUN dotnet publish "CapShop.AdminService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CapShop.AdminService.dll"]
