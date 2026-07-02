import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from "@features/auth/store/authStore";
import { useThemeStore } from "@shared/store/themeStore";
import { useSignalR } from "@shared/hooks/useSignalR";
import { IncomingCallModal } from "@features/calls/components/IncomingCallModal";
import { Colors } from "@shared/constants/colors";

// Ngăn Splash của hệ thống tự ẩn
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadAuth } = useAuthStore();
  const { loadTheme, isDarkMode } = useThemeStore();
  const [appIsReady, setAppIsReady] = useState(false);

  const { incomingCall, acceptCall, rejectCall } = useSignalR();

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([loadAuth(), loadTheme()]);
        // Chờ thêm 500ms để đảm bảo UI đã render sẵn sàng phía sau
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        if (useAuthStore.getState().isLoggedIn) {
          router.replace("/(tabs)/chats");
        } else {
          router.replace("/(auth)/login");
        }
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Ẩn Splash Screen
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await acceptCall(incomingCall.callerConnectionId);
      router.push(
        `/call/incoming?name=${incomingCall.callerName}&connectionId=${incomingCall.callerConnectionId}&isCaller=false`
      );
    }
  };

  const handleRejectCall = async () => {
    if (incomingCall) {
      await rejectCall(incomingCall.callerConnectionId);
    }
  };

  return (
    // rootContainer đảm bảo nền luôn tối
    <View style={styles.rootContainer}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {appIsReady && (
        <Stack
          screenOptions={{
            headerShown: false,
            // Ép màu nền của Stack sang màu tối để tránh chớp trắng khi chuyển màn hình
            contentStyle: { backgroundColor: Colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="call/[id]"
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
      )}

      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
