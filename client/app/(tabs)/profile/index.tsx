import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

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

  useEffect(() => { fetchProfile(); }, [accessToken]);

  const handleSave = async () => {
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
        setEditing(false);
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
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(false)} style={styles.editBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar}>
          {profile?.profilePictureUrl ? (
            <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {profile?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Tên hiển thị"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={styles.profileName}>{profile?.username}</Text>
        )}
        <Text style={styles.profilePhone}>{profile?.phoneNumber}</Text>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Giới thiệu</Text>
        {editing ? (
          <TextInput
            style={styles.bioInput}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Thêm giới thiệu về bạn..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={150}
          />
        ) : (
          <Text style={styles.bioText}>{profile?.bio || 'Chưa có giới thiệu'}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Thông tin</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{profile?.phoneNumber}</Text>
        </View>
        {profile?.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{profile?.email}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>Tham gia {profile?.createdAt ? formatDate(profile.createdAt) : ''}</Text>
        </View>
      </View>

      {/* Save / Logout */}
      {editing && (
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg, paddingBottom: Layout.spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  editBtn: { padding: 8 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  profileName: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  profilePhone: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  nameInput: {
    color: Colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.primary,
    paddingVertical: 4, minWidth: 200, textAlign: 'center',
  },
  section: { paddingHorizontal: Layout.spacing.lg, marginBottom: 20 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  bioText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  bioInput: {
    color: Colors.text, fontSize: 15, lineHeight: 22,
    backgroundColor: Colors.surfaceInput, borderRadius: 10,
    padding: 12, minHeight: 80, textAlignVertical: 'top',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoText: { color: Colors.text, fontSize: 15 },
  saveBtn: {
    marginHorizontal: Layout.spacing.lg, marginBottom: 16,
    backgroundColor: Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Layout.spacing.lg, marginTop: 8,
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.danger,
  },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
});
