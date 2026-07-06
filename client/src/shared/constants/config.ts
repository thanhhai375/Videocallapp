import Constants from 'expo-constants';

// Tự động lấy IP của máy tính (từ Metro Bundler) để không phải đổi thủ công khi đổi mạng Wi-Fi
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || '192.168.1.6';

// const DEV_SERVER = "http://10.0.2.2:5228"; // Dành riêng cho máy ảo (Bỏ qua Tường lửa)
const DEV_SERVER = `https://public-mice-fry.loca.lt`; // Đã bỏ dấu / ở cuối để tránh lỗi đường dẫn

export const SERVER_URL = DEV_SERVER;
export const HUB_URL = `${SERVER_URL}/hubs`;
export const API_URL = `${SERVER_URL}/api`;
