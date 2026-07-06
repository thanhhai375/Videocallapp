import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Switch,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@shared/constants/colors';
import { useThemeStore } from '@shared/store/themeStore';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';
import { ProfileData } from '@features/profile/types';
import { SettingItem } from '@features/profile/components/SettingItem';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Preferences state
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  const Colors = useTheme();
  const styles = getStyles(Colors);

  const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      AsyncStorage.getItem('activeStatus').then(v => { if (v !== null) setIsActiveStatus(v === 'true'); });
    }, [accessToken])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      } },
    ]);
  };

  const toggleDarkMode = (val: boolean) => {
    setDarkMode(val);
  };

  const toggleActiveStatus = (val: boolean) => {
    setIsActiveStatus(val);
    AsyncStorage.setItem('activeStatus', String(val));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={Colors.primary} />}
      >
        {/* Centered Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/profile/edit', params: { profile: JSON.stringify(profile) } })}
            style={styles.avatarWrapper}
          >
            {profile?.profilePictureUrl ? (
              <Image source={{ uri: profile.profilePictureUrl }} style={styles.largeAvatar} />
            ) : (
              <View style={styles.largeAvatarPlaceholder}>
                <Text style={styles.largeAvatarText}>{profile?.username?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile?.username || 'Người dùng'}</Text>
          <Text style={styles.profileSubtitle}>{profile?.phoneNumber || 'Chưa cập nhật SĐT'}</Text>
        </View>

        {/* Section: Settings & Preferences */}
        <Text style={styles.sectionHeader}>Cài đặt & Tiện ích</Text>
        <View style={styles.sectionContainer}>
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Bảo mật" 
            subtitle="Đổi mật khẩu tài khoản" 
            action={() => router.push('/profile/security')} 
          />
          <SettingItem 
            icon="moon-outline" 
            title="Chế độ tối" 
            subtitle="Giao diện ứng dụng" 
            rightElement={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ true: Colors.primary }} />} 
          />
          <SettingItem 
            icon="ellipse-outline" 
            title="Trạng thái hoạt động" 
            subtitle="Hiển thị khi bạn trực tuyến" 
            rightElement={<Switch value={isActiveStatus} onValueChange={toggleActiveStatus} trackColor={{ true: Colors.primary }} />} 
          />
          <SettingItem 
            icon="notifications-outline" 
            title="Thông báo & Âm thanh" 
            subtitle="Nhạc chuông và rung cuộc gọi" 
            action={() => router.push('/profile/notifications')} 
          />
          <SettingItem 
            icon="chatbox-ellipses-outline" 
            title="Tin nhắn chờ" 
            subtitle="Yêu cầu tin nhắn từ người lạ" 
            action={() => router.push('/chat/requests')} 
          />
          <SettingItem 
            icon="ban-outline" 
            title="Người dùng đã chặn" 
            subtitle="Quản lý tài khoản đã chặn" 
            action={() => router.push('/profile/blocked')} 
            isLast={true}
          />
        </View>

        {/* Section: Support & Info */}
        <Text style={styles.sectionHeader}>Hỗ trợ & Tài khoản</Text>
        <View style={styles.sectionContainer}>
          <SettingItem 
            icon="bug-outline" 
            title="Báo cáo sự cố" 
            subtitle="Gửi phản hồi lỗi ứng dụng" 
            action={() => router.push('/profile/feedback')} 
          />
          <SettingItem 
            icon="information-circle-outline" 
            title="Về ứng dụng" 
            subtitle="Phiên bản, điều khoản và bảo mật" 
            action={() => router.push('/profile/about')} 
            isLast={true}
          />
        </View>

        {/* Section: Logout */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <SettingItem 
            icon="log-out-outline" 
            title="Đăng xuất tài khoản" 
            action={handleLogout} 
            danger={true} 
            isLast={true} 
          />
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Layout.spacing.lg, paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionContainer: {
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Layout.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  largeAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  largeAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
