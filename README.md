# VideoCallApp - Hướng dẫn khởi động

## Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài đặt và đang chạy.

## Khởi động Backend + Database bằng 1 lệnh

```bash
cd server
docker-compose up -d
```

Docker sẽ tự động:
1. Tải PostgreSQL 16
2. Tạo database `videocalldb`
3. Build và chạy Backend API .NET 8
4. Tự động tạo tất cả các bảng trong database
5. Seed dữ liệu mặc định (Nam, Hung, Lan, Minh - mật khẩu: 123)

API sẽ chạy tại: `http://localhost:5228`

## Khởi động App di động

```bash
cd client
npx expo run:android
```

## Dừng lại

```bash
cd server
docker-compose down
```

## Tài khoản mặc định

| Tên | Số điện thoại | Mật khẩu |
|-----|--------------|----------|
| Nam | 0901111111 | 123 |
| Hung | 0902222222 | 123 |
| Lan | 0903333333 | 123 |
| Minh | 0904444444 | 123 |
