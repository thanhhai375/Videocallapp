import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Danh sách bạn bè" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      <Stack.Screen
        name="call/[id]"
        options={{ title: "Video Call", headerShown: false }}
      />
    </Stack>
  );
}
