# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["VideoCall/VideoCall.csproj", "VideoCall/"]
RUN dotnet restore "VideoCall/VideoCall.csproj"

COPY . .
WORKDIR "/src/VideoCall"
RUN dotnet build "VideoCall.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VideoCall.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/wwwroot/uploads

COPY --from=publish /app/publish .

EXPOSE 5228
ENTRYPOINT ["dotnet", "VideoCall.dll"]
