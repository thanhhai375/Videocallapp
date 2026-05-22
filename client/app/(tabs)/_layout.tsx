import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@shared/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bg,
          shadowColor: 'transparent', // iOS
          elevation: 0, // Android
        },
        headerTintColor: Colors.text,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: '#3E4042', // Messenger dark mode divider
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Đoạn chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={26} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'Tin',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "albums" : "albums-outline"} size={26} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={26} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "menu" : "menu-outline"} size={32} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
