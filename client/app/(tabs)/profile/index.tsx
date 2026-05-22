import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { useSignalR } from '@shared/hooks/useSignalR';
import { Avatar } from '@shared/components/Avatar';

export default function ProfileScreen() {
  const { userName, logout } = useAuthStore();
  const { disconnect } = useSignalR();

  const handleLogout = async () => {
    await disconnect();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Me</Text>
      </View>

      <View style={styles.profileSection}>
        <Avatar name={userName || 'User'} size="xl" />
        <Text style={styles.name}>{userName}</Text>
      </View>

      <View style={styles.optionsSection}>
        <TouchableOpacity style={styles.optionBtn}>
          <Text style={styles.optionIcon}>🌙</Text>
          <Text style={styles.optionText}>Dark Mode</Text>
          <Text style={styles.optionValue}>On</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionBtn}>
          <Text style={styles.optionIcon}>🔔</Text>
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  name: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Layout.spacing.md,
  },
  optionsSection: {
    marginTop: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: Layout.spacing.md,
  },
  optionText: {
    flex: 1,
    color: Colors.text,
    fontSize: 17,
  },
  optionValue: {
    color: Colors.textSecondary,
    fontSize: 17,
  },
  logoutBtn: {
    marginTop: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 17,
    fontWeight: '600',
  },
});
