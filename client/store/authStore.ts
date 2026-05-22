import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, name: string) => Promise<void>;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userName: null,
  isLoggedIn: false,

  setAuth: async (token: string, name: string) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("userName", name);
    set({ token, userName: name, isLoggedIn: true });
  },

  loadAuth: async () => {
    const token = await AsyncStorage.getItem("token");
    const userName = await AsyncStorage.getItem("userName");
    if (token && userName) {
      set({ token, userName, isLoggedIn: true });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userName");
    set({ token: null, userName: null, isLoggedIn: false });
  },
}));
