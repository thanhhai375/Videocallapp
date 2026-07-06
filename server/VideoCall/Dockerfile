# Sử dụng SDK .NET 8.0 để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy tệp .csproj và khôi phục các dependencies (nuget packages)
COPY *.csproj ./
RUN dotnet restore

# Copy toàn bộ mã nguồn và tiến hành build
COPY . ./
RUN dotnet publish -c Release -o out

# Sử dụng ASP.NET Core Runtime 8.0 để chạy ứng dụng (nhẹ hơn SDK)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Mở port 5228 theo cấu hình hiện hành của ứng dụng
EXPOSE 5228
ENV ASPNETCORE_URLS=http://+:5228

# Lệnh khởi chạy
ENTRYPOINT ["dotnet", "VideoCall.dll"]
