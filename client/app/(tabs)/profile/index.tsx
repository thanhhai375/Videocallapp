import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { useSignalR } from '@shared/hooks/useSignalR';
import { Avatar } from '@shared/components/Avatar';

export default function ProfileScreen() {
  const { userName, logout } = useAuthStore();
  const { disconnect } = useSignalR();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await disconnect();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Me</Text>
      </View>

      <View style={styles.profileSection}>
        <Avatar name={userName || 'User'} size="xl" />
        <Text style={styles.name}>{userName}</Text>
      </View>

      <View style={styles.settingsSection}>
        {/* Mock Options */}
        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="person-circle" size={24} color={Colors.text} />
            </View>
            <Text style={styles.settingLabel}>Tài khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="lock-closed" size={22} color={Colors.text} />
            </View>
            <Text style={styles.settingLabel}>Quyền riêng tư</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="globe" size={22} color={Colors.text} />
            </View>
            <Text style={styles.settingLabel}>Ngôn ngữ</Text>
          </View>
          <Text style={styles.settingValue}>Tiếng Việt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="help-circle" size={24} color={Colors.text} />
            </View>
            <Text style={styles.settingLabel}>Trợ giúp & Hỗ trợ</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Existing Options */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="moon" size={20} color={Colors.text} />
            </View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Text style={styles.settingValue}>On</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: Colors.danger }]}>
              <Ionicons name="notifications" size={20} color="#FFF" />
            </View>
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
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
  settingsSection: {
    paddingHorizontal: Layout.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  settingLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
