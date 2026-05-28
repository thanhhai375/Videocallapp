import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image, RefreshControl,
  Switch, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';

import { ProfileData } from '@features/profile/types';
import { EditProfileModal } from '@features/profile/components/EditProfileModal';
import { SettingItem } from '@features/profile/components/SettingItem';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Update Modal state
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  // Preferences state
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditUsername(data.username);
        setEditBio(data.bio || '');
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { 
    fetchProfile(); 
    // Load local prefs
    AsyncStorage.getItem('darkMode').then(v => { if (v !== null) setIsDarkMode(v === 'true'); });
    AsyncStorage.getItem('activeStatus').then(v => { if (v !== null) setIsActiveStatus(v === 'true'); });
  }, [accessToken]);

  // Logic extracted to EditProfileModal

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Cho phép truy cập thư viện ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: filename, type: 'image/jpeg' } as any);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!uploadRes.ok) { Alert.alert('Lỗi', 'Không tải được ảnh'); return; }
      const { url } = await uploadRes.json();

      const avatarRes = await fetch(`${API_URL}/profile/avatar`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (avatarRes.ok) {
        Alert.alert('✅', 'Đã cập nhật ảnh đại diện!');
        fetchProfile();
      }
    } catch { Alert.alert('Lỗi', 'Có lỗi xảy ra'); }
    finally { setUploadingAvatar(false); }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const toggleDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    AsyncStorage.setItem('darkMode', String(val));
    // Implementation of actual theme switching omitted for brevity
  };

  const toggleActiveStatus = (val: boolean) => {
    setIsActiveStatus(val);
    AsyncStorage.setItem('activeStatus', String(val));
    // Would sync with server or signalR in a full implementation
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar}>
            <View style={styles.avatarContainer}>
              {profile?.profilePictureUrl ? (
                <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{profile?.username?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={styles.avatarCameraBadge}>
                {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfoBox}>
            <Text style={styles.profileName}>{profile?.username}</Text>
            <Text style={styles.profilePhone}>{profile?.phoneNumber}</Text>
          </View>
        </View>

        {/* Section: Account */}
        <Text style={styles.sectionHeader}>Tài khoản</Text>
        <View style={styles.sectionContainer}>
          <SettingItem icon="person-outline" title="Cập nhật thông tin" subtitle="Tên, Tiểu sử" action={() => setEditModalVisible(true)} />
          <SettingItem icon="shield-checkmark-outline" title="Bảo mật" subtitle="Đổi mật khẩu" action={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển!')} />
        </View>

        {/* Section: Preferences */}
        <Text style={styles.sectionHeader}>Tùy chọn</Text>
        <View style={styles.sectionContainer}>
          <SettingItem icon="moon-outline" title="Chế độ tối" subtitle="Giao diện ứng dụng" 
            rightElement={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ true: Colors.primary }} />} 
          />
          <SettingItem icon="ellipse-outline" title="Trạng thái hoạt động" subtitle="Hiển thị khi bạn online" 
            rightElement={<Switch value={isActiveStatus} onValueChange={toggleActiveStatus} trackColor={{ true: Colors.primary }} />} 
          />
          <SettingItem icon="notifications-outline" title="Thông báo & Âm thanh" subtitle="Nhạc chuông, rung" action={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển!')} />
        </View>

        {/* Section: Danger Zone */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <SettingItem icon="log-out-outline" title="Đăng xuất" action={handleLogout} danger />
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSuccess={fetchProfile}
        profile={profile}
        accessToken={accessToken}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Layout.spacing.lg, paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  avatarCameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  profileInfoBox: {
    alignItems: 'center',
  },
  profileName: { color: Colors.text, fontSize: 24, fontWeight: 'bold' },
  profilePhone: { color: Colors.textSecondary, fontSize: 15, marginTop: 4 },
  
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

});
