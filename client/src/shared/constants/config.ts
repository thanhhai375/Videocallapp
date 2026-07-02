// Cấu hình URL server
// Khi test trên emulator Android: dùng 10.0.2.2 thay cho localhost
// Khi test trên device thật: dùng IP máy tính (vd: 192.168.1.x)

// const DEV_SERVER = "http://10.0.2.2:5228"; // Dành riêng cho máy ảo (Bỏ qua Tường lửa)
const DEV_SERVER = "http://172.20.10.5:5228"; // Dùng IP Wi-Fi để các máy khác có thể kết nối

export const SERVER_URL = DEV_SERVER;
export const HUB_URL = `${SERVER_URL}/hubs`;
export const API_URL = `${SERVER_URL}/api`;
