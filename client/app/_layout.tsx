import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@features/auth/store/authStore";
import { useSignalR } from "@shared/hooks/useSignalR";
import { IncomingCallModal } from "@features/calls/components/IncomingCallModal";

export default function RootLayout() {
  const { loadAuth, isLoggedIn } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  
  // Initialize global SignalR listeners (including incoming calls)
  const { incomingCall, acceptCall, rejectCall } = useSignalR();

  useEffect(() => {
    // Load token từ AsyncStorage khi khởi động
    loadAuth().then(() => {
      setIsReady(true);
      if (isLoggedIn) {
        router.replace("/(tabs)/chats");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, [isLoggedIn, loadAuth]);

  if (!isReady) return null;

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await acceptCall(incomingCall.callerConnectionId);
      // Giả sử ta tìm được userId từ danh sách (ở đây truyền fake id tạm thời hoặc lấy từ store)
      // Để hoàn hảo, ta nên có userId trong incomingCall payload.
      router.push(`/call/incoming?name=${incomingCall.callerName}&connectionId=${incomingCall.callerConnectionId}&isCaller=false`);
    }
  };

  const handleRejectCall = async () => {
    if (incomingCall) {
      await rejectCall(incomingCall.callerConnectionId);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="call/[id]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>

      <IncomingCallModal 
        call={incomingCall} 
        onAccept={handleAcceptCall} 
        onReject={handleRejectCall} 
      />
    </>
  );
}
