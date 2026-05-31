import { Redirect } from "expo-router";
import { useAuthStore } from "@features/auth/store/authStore";

export default function Index() {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}
