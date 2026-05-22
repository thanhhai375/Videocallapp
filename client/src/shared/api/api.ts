import axios from "axios";
import { API_URL } from '@shared/constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface LoginResponse {
  token: string;
  name: string;
}

/**
 * Đăng nhập và nhận token (Base64 của userId)
 */
export const login = async (
  name: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", {
    name,
    password,
  });
  return response.data;
};

export default api;
