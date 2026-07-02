import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const { accessToken } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh để đính kèm hình ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);

    try {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() || 'screenshot.jpg';

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
        Alert.alert('Lỗi', 'Không tải được hình ảnh lên máy chủ.');
        return;
      }

      const data = await uploadRes.json();
      setScreenshotUrl(data.url);
    } catch (e) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình tải ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotUrl(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Thông báo', 'Vui lòng mô tả chi tiết sự cố bạn đang gặp phải.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/profile/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          screenshotUrl,
        }),
      });

      if (res.ok) {
        Alert.alert('Thành công', 'Cảm ơn phản hồi của bạn! Báo cáo sự cố đã được gửi đi thành công.', [
          {
            text: 'Đồng ý',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Thất bại', data.message || 'Có lỗi xảy ra khi gửi báo cáo.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tên sự cố (Không bắt buộc)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Lỗi cuộc gọi, Không gửi được ảnh..."
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Mô tả chi tiết lỗi <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Vui lòng mô tả chi tiết lỗi xảy ra như thế nào, bạn làm gì thì gặp lỗi..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Ảnh chụp màn hình lỗi (Không bắt buộc)</Text>
        {isUploading ? (
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadingText}>Đang tải ảnh lên...</Text>
          </View>
        ) : screenshotUrl ? (
          <View style={styles.screenshotWrapper}>
            <Image source={{ uri: screenshotUrl }} style={styles.screenshotPreview} />
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveScreenshot}>
              <Ionicons name="close-circle" size={26} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
            <Text style={styles.attachText}>Đính kèm ảnh chụp màn hình</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Gửi báo cáo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
      paddingHorizontal: Layout.spacing.md,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      backgroundColor: Colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    scrollContent: {
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    required: {
      color: '#EF4444',
    },
    input: {
      backgroundColor: Colors.surfaceElevated,
      color: Colors.text,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    textArea: {
      height: 120,
      paddingTop: 12,
    },
    attachBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.primary,
      borderStyle: 'dashed',
      borderRadius: 10,
      paddingVertical: 14,
      backgroundColor: Colors.primary + '10',
      gap: 8,
    },
    attachText: {
      color: Colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    uploadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      backgroundColor: Colors.surfaceElevated,
      borderRadius: 10,
      gap: 10,
    },
    uploadingText: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
    screenshotWrapper: {
      position: 'relative',
      width: 150,
      height: 150,
      borderRadius: 10,
      overflow: 'visible',
      marginTop: 4,
    },
    screenshotPreview: {
      width: 150,
      height: 150,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    removeBtn: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: Colors.bg,
      borderRadius: 13,
    },
    submitButton: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
    },
    submitButtonDisabled: {
      backgroundColor: Colors.primary + '80',
    },
    submitText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
