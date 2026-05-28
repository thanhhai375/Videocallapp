import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@shared/constants/config";

interface UserProfile {
  id: string;
  username: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  bio?: string;
  role?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userName: string | null;
  userId: string | null;
  user: UserProfile | null;
  isLoggedIn: boolean;

  // For backward compatibility with SignalR hook
  token: string | null;

  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => Promise<void>;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  userName: null,
  userId: null,
  user: null,
  isLoggedIn: false,
  token: null, // alias for accessToken

  setAuth: async (accessToken: string, refreshToken: string, user: UserProfile) => {
    await AsyncStorage.multiSet([
      ["accessToken", accessToken],
      ["refreshToken", refreshToken],
      ["userId", user.id],
      ["userName", user.username],
      ["user", JSON.stringify(user)],
    ]);
    set({
      accessToken,
      refreshToken,
      token: accessToken,
      userName: user.username,
      userId: user.id,
      user,
      isLoggedIn: true
    });
  },

  loadAuth: async () => {
    const pairs = await AsyncStorage.multiGet([
      "accessToken", "refreshToken", "userId", "userName", "user"
    ]);
    const [accessToken, refreshToken, userId, userName, userStr] = pairs.map(p => p[1]);

    if (accessToken && refreshToken && userId && userName) {
      const user = userStr ? JSON.parse(userStr) as UserProfile : { id: userId, username: userName, phoneNumber: "" };
      set({
        accessToken,
        refreshToken,
        token: accessToken,
        userId,
        userName,
        user,
        isLoggedIn: true
      });
    }
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await get().logout();
        return null;
      }

      const data = await response.json();
      await AsyncStorage.multiSet([
        ["accessToken", data.accessToken],
        ["refreshToken", data.refreshToken],
      ]);
      set({ accessToken: data.accessToken, refreshToken: data.refreshToken, token: data.accessToken });
      return data.accessToken;
    } catch {
      return null;
    }
  },

  logout: async () => {
    const { refreshToken } = get();

    // Revoke refresh token on server
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {}
    }

    await AsyncStorage.multiRemove([
      "accessToken", "refreshToken", "userId", "userName", "user"
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      token: null,
      userName: null,
      userId: null,
      user: null,
      isLoggedIn: false
    });
  },
}));
