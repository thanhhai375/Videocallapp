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

interface ProfileData {
  id: string;
  username: string;
  phoneNumber: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  isOnline: boolean;
  createdAt: string;
}

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

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅', data.message);
        setEditModalVisible(false);
        fetchProfile();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

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

  const renderSettingItem = (icon: any, title: string, subtitle?: string, action?: () => void, rightElement?: React.ReactNode, danger?: boolean) => (
    <TouchableOpacity style={styles.settingItem} onPress={action} disabled={!action}>
      <View style={[styles.settingIconBox, danger && { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
        <Ionicons name={icon} size={22} color={danger ? Colors.danger : Colors.text} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, danger && { color: Colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : (action ? <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} /> : null)}
    </TouchableOpacity>
  );

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
          {renderSettingItem('person-outline', 'Cập nhật thông tin', 'Tên, Tiểu sử', () => setEditModalVisible(true))}
          {renderSettingItem('shield-checkmark-outline', 'Bảo mật', 'Đổi mật khẩu', () => Alert.alert('Thông báo', 'Tính năng đang được phát triển!'))}
        </View>

        {/* Section: Preferences */}
        <Text style={styles.sectionHeader}>Tùy chọn</Text>
        <View style={styles.sectionContainer}>
          {renderSettingItem('moon-outline', 'Chế độ tối', 'Giao diện ứng dụng', undefined, 
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ true: Colors.primary }} />
          )}
          {renderSettingItem('ellipse-outline', 'Trạng thái hoạt động', 'Hiển thị khi bạn online', undefined, 
            <Switch value={isActiveStatus} onValueChange={toggleActiveStatus} trackColor={{ true: Colors.primary }} />
          )}
          {renderSettingItem('notifications-outline', 'Thông báo & Âm thanh', 'Nhạc chuông, rung', () => Alert.alert('Thông báo', 'Tính năng đang được phát triển!'))}
        </View>

        {/* Section: Danger Zone */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          {renderSettingItem('log-out-outline', 'Đăng xuất', undefined, handleLogout, undefined, true)}
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Tên hiển thị</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Nhập tên của bạn"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Tiểu sử</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Thêm vài dòng giới thiệu..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleSaveInfo}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: Colors.surfaceInput,
    color: Colors.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
