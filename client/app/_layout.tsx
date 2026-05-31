import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from "@features/auth/store/authStore";
import { useSignalR } from "@shared/hooks/useSignalR";
import { IncomingCallModal } from "@features/calls/components/IncomingCallModal";

// Ngăn Splash Screen tự ẩn
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadAuth } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  const { incomingCall, acceptCall, rejectCall } = useSignalR();

  useEffect(() => {
    async function prepare() {
      try {
        // Load thông tin đăng nhập từ bộ nhớ
        await loadAuth();
        // Chờ thêm một chút để đảm bảo mọi thứ sẵn sàng
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
      // Ẩn Splash Screen khi app đã sẵn sàng
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

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />

      <Stack screenOptions={{ headerShown: false }}>
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

      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </>
  );
}
