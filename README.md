# 📱 VideoCall Monorepo

Monorepo chứa server backend và client React Native cho ứng dụng Video Call.

## Cấu trúc

```
VideoCallMonorepo/
├── server/     # ASP.NET Core Backend (SignalR + REST API)
└── client/     # React Native (Expo) Mobile App
```

## Hướng dẫn chạy

### Server

```bash
cd server/VideoCall
dotnet run
# Server chạy tại http://localhost:5000
```

### Client (React Native / Expo)

```bash
cd client
npm install
npx expo start
# Quét QR bằng Expo Go hoặc chạy emulator
```

## Tech Stack

| | Công nghệ |
|---|---|
| **Backend** | ASP.NET Core, SignalR, BCrypt |
| **Mobile** | React Native, Expo, Expo Router |
| **Realtime** | SignalR (chat + WebRTC signaling) |
| **Video Call** | WebRTC (react-native-webrtc) |
| **State** | Zustand |
| **HTTP** | Axios |

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, trả về token |
| GET | `/api/Account/users` | Danh sách users |

## SignalR Hub: `/hubs`

Kết nối: `ws://localhost:5000/hubs?token=<base64_token>`

| Event (Server → Client) | Mô tả |
|---|---|
| `LoadFriends` | Danh sách users khi kết nối |
| `UserStatusChanged` | Thay đổi trạng thái online |
| `ReceiveMessage` | Nhận tin nhắn mới |
| `LoadChatHistory` | Lịch sử chat |
| `IncomingCall` | Cuộc gọi đến |
| `CallAccepted/Rejected` | Phản hồi cuộc gọi |
| `ReceiveOffer/Answer/Ice` | WebRTC signaling |
