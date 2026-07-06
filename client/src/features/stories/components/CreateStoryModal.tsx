import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  insetsTop: number;
}

const BG_COLORS = [
  '#0084FF', '#E91E8C', '#FF6B35', '#7B68EE',
  '#00C851', '#FF4444', '#FF8800', '#00BCD4',
];

export function CreateStoryModal({ visible, onClose, onSuccess, accessToken, insetsTop }: Props) {
  const [storyText, setStoryText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setStoryImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!storyText.trim() && !storyImage) {
      Alert.alert('Thông báo', 'Nhập nội dung hoặc chọn ảnh để đăng tin');
      return;
    }
    setPosting(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType = 'Text';

      if (storyImage) {
        const uploadRes = await FileSystem.uploadAsync(`${API_URL}/upload`, storyImage, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'image/jpeg',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (uploadRes.status >= 200 && uploadRes.status < 300) {
          const data = JSON.parse(uploadRes.body);
          mediaUrl = data.url;
          mediaType = 'Image';
        } else {
          Alert.alert('Lỗi', 'Không thể tải ảnh lên');
          setPosting(false);
          return;
        }
      }

      const res = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: storyText.trim() || undefined,
          mediaUrl,
          mediaType,
          backgroundColor: selectedBg,
        }),
      });

      if (res.ok) {
        Alert.alert('✅', 'Đã đăng tin thành công!');
        setStoryText('');
        setStoryImage(null);
        onSuccess();
        onClose();
      } else {
        Alert.alert('Lỗi', 'Không thể đăng tin');
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
    finally { setPosting(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.createModal, { paddingTop: insetsTop }]}>
        <View style={styles.createModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.createModalTitle}>Tạo tin</Text>
          <TouchableOpacity
            style={[styles.postBtn, (posting || (!storyText && !storyImage)) && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={posting || (!storyText.trim() && !storyImage)}
          >
            {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Đăng</Text>}
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={[styles.storyPreview, { backgroundColor: storyImage ? '#000' : selectedBg }]}>
          {storyImage ? (
            <Image source={{ uri: storyImage }} style={styles.storyPreviewImg} resizeMode="contain" />
          ) : null}
          {storyText ? (
            <Text style={styles.storyPreviewText}>{storyText}</Text>
          ) : null}
          {!storyImage && !storyText && (
            <Text style={styles.storyPreviewPlaceholder}>Tin của bạn sẽ hiện ở đây...</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.createControls}>
          <TextInput
            style={styles.storyTextInput}
            placeholder="Viết gì đó..."
            placeholderTextColor={Colors.textMuted}
            value={storyText}
            onChangeText={setStoryText}
            multiline
            maxLength={200}
          />

          {/* Image picker */}
          <TouchableOpacity style={styles.controlRow} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
            <Text style={styles.controlLabel}>{storyImage ? '✅ Đã chọn ảnh' : 'Thêm ảnh'}</Text>
          </TouchableOpacity>

          {/* Background colors */}
          <Text style={styles.bgLabel}>Màu nền</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bgRow}>
            {BG_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.bgChip, { backgroundColor: color }, selectedBg === color && styles.bgChipSelected]}
                onPress={() => { setSelectedBg(color); setStoryImage(null); }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  createModal: { flex: 1, backgroundColor: Colors.bg },
  createModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  createModalTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  storyPreview: {
    height: 300, marginHorizontal: 16, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  storyPreviewImg: { width: '100%', height: '100%', borderRadius: 20 },
  storyPreviewText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 20 },
  storyPreviewPlaceholder: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  createControls: { padding: 16, gap: 16 },
  storyTextInput: {
    backgroundColor: Colors.surfaceInput, color: Colors.text, borderRadius: 12,
    padding: 14, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
  },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlLabel: { color: Colors.text, fontSize: 15 },
  bgLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  bgRow: { flexDirection: 'row' },
  bgChip: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  bgChipSelected: { borderWidth: 3, borderColor: '#fff' },
});
