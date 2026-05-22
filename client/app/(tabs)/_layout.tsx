import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          shadowColor: 'transparent', // iOS
          elevation: 0, // Android
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 24,
        },
        headerTitleAlign: 'left',
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <span style={{ fontSize: 24, color }}>💬</span>,
          headerShown: false, // We will build a custom header inside chats/index
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          tabBarIcon: ({ color }) => <span style={{ fontSize: 24, color }}>👥</span>,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color }) => <span style={{ fontSize: 24, color }}>📞</span>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <span style={{ fontSize: 24, color }}>⚙️</span>,
        }}
      />
    </Tabs>
  );
}
