// Cấu hình URL server
// Khi test trên emulator Android: dùng 10.0.2.2 thay cho localhost
// Khi test trên device thật: dùng IP máy tính (vd: 192.168.1.x)

const DEV_SERVER = "http://10.0.2.2:5228"; // Android emulator
// const DEV_SERVER = "http://localhost:5228"; // iOS simulator
// const DEV_SERVER = "http://192.168.1.100:5000"; // Device thật

export const SERVER_URL = DEV_SERVER;
export const HUB_URL = `${SERVER_URL}/hubs`;
export const API_URL = `${SERVER_URL}/api`;
