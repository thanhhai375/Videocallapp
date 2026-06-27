import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@shared/constants/colors';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';
import { ProfileData } from '@features/profile/types';

export default function EditProfileScreen() {
  const { profile: profileJson } = useLocalSearchParams<{ profile: string }>();
  const profile: ProfileData | null = profileJson ? JSON.parse(profileJson) : null;
  const { accessToken } = useAuthStore();
  const Colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(Colors);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.profilePictureUrl || null);
  
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editEmail, setEditEmail] = useState(profile?.email || '');
  const [editJob, setEditJob] = useState(profile?.job || '');
  const [editDateOfBirth, setEditDateOfBirth] = useState(profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '');
  const [editGender, setEditGender] = useState(profile?.gender || '');

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);

    try {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'avatar.jpg';

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        Alert.alert('Lỗi', 'Không tải được ảnh đại diện.');
        return;
      }

      const { url } = await uploadRes.json();

      const avatarRes = await fetch(`${API_URL}/profile/avatar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarUrl: url,
        }),
      });

      if (avatarRes.ok) {
        setAvatarUrl(url);
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện.');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện.');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật ảnh.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    
    // Validate Date format if provided
    if (editDateOfBirth && editDateOfBirth.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(editDateOfBirth.trim())) {
        Alert.alert('Lỗi', 'Ngày sinh phải có định dạng YYYY-MM-DD (Ví dụ: 1995-10-25)');
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          email: editEmail,
          job: editJob,
          dateOfBirth: editDateOfBirth || null,
          gender: editGender,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅', data.message || 'Đã lưu thay đổi');
        router.back();
      } else {
        let errorMsg = data.message;
        if (!errorMsg && data.errors) {
          errorMsg = Object.values(data.errors).flat().join('\n');
        }
        Alert.alert('Lỗi', errorMsg || data.title || 'Không thể lưu thay đổi');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{editUsername.charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHelperText}>Nhấn vào ảnh để thay đổi</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tên hiển thị</Text>
          <TextInput
            style={styles.input}
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Nhập tên của bạn"
            placeholderTextColor={Colors.textMuted}
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tiểu sử</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Thêm vài dòng giới thiệu..."
            placeholderTextColor={Colors.textMuted}
            multiline
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email liên hệ</Text>
          <TextInput
            style={styles.input}
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="Ví dụ: example@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Công việc / Nghề nghiệp</Text>
          <TextInput
            style={styles.input}
            value={editJob}
            onChangeText={setEditJob}
            placeholder="Ví dụ: Lập trình viên"
            placeholderTextColor={Colors.textMuted}
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày sinh (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={editDateOfBirth}
            onChangeText={setEditDateOfBirth}
            placeholder="Ví dụ: 1995-10-25"
            placeholderTextColor={Colors.textMuted}
            editable={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Giới tính</Text>
          <TextInput
            style={styles.input}
            value={editGender}
            onChangeText={setEditGender}
            placeholder="Nam / Nữ / Khác"
            placeholderTextColor={Colors.textMuted}
            editable={true}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSaveInfo}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      backgroundColor: Colors.surface,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.text,
    },
    scrollContent: {
      padding: 24,
      paddingBottom: 40,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors.surfaceInput,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: Colors.divider,
      position: 'relative',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
      backgroundColor: Colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: {
      fontSize: 36,
      fontWeight: 'bold',
      color: Colors.primary,
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: Colors.bg,
    },
    avatarHelperText: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      color: Colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
      marginLeft: 4,
      fontWeight: '500',
    },
    input: {
      backgroundColor: Colors.surfaceInput,
      color: Colors.text,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
      backgroundColor: Colors.surfaceElevated,
    },
    saveBtn: {
      backgroundColor: Colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
