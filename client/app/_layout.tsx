import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { View, StyleSheet, StatusBar, LogBox } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from "@features/auth/store/authStore";
import { useThemeStore } from "@shared/store/themeStore";
import { useSignalR } from "@shared/hooks/useSignalR";
import { IncomingCallModal } from "@features/calls/components/IncomingCallModal";
import { useTheme } from "@shared/constants/colors";

// Disable all logs (redbox/yellowbox) so they don't block interaction
LogBox.ignoreAllLogs(true);

// Ngăn Splash của hệ thống tự ẩn
SplashScreen.preventAutoHideAsync();



export default function RootLayout() {
  const { loadAuth } = useAuthStore();
  const { loadTheme, isDarkMode } = useThemeStore();
  const [appIsReady, setAppIsReady] = useState(false);
  const Colors = useTheme();
  const styles = getStyles(Colors);

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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

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

const getStyles = (Colors: any) => StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
