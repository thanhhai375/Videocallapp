// Cấu hình URL server
// Khi test trên emulator Android: dùng 10.0.2.2 thay cho localhost
// Khi test trên device thật: dùng IP máy tính (vd: 192.168.1.x)

// const DEV_SERVER = "http://10.0.2.2:5228"; // Dành riêng cho máy ảo (Bỏ qua Tường lửa)
const DEV_SERVER = "http://192.168.1.3:5228"; // Chỉ dùng cho máy thật, nhưng đang bị Tường lửa chặn

export const SERVER_URL = DEV_SERVER;
export const HUB_URL = `${SERVER_URL}/hubs`;
export const API_URL = `${SERVER_URL}/api`;
