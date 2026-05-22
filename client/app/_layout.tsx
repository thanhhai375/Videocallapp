import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const { isLoggedIn, loadAuth } = useAuthStore();

  useEffect(() => {
    // Load token từ AsyncStorage khi khởi động
    loadAuth().then(() => {
      if (isLoggedIn) {
        router.replace("/(main)/");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
