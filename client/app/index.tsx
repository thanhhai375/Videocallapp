import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@features/auth/store/authStore";

export default function Index() {
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // Adding a small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        router.replace("/(tabs)/chats");
      } else {
        router.replace("/(auth)/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  return <View style={{ flex: 1, backgroundColor: '#000814' }} />;
}
