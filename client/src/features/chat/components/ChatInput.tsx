import React, { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';

interface ChatInputProps {
  onSend: (message: string, type?: 'Text' | 'Image' | 'Audio') => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export function ChatInput({ onSend, onTypingStart, onTypingEnd }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (newText.trim().length > 0) {
      onTypingStart?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { onTypingEnd?.(); }, 2000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim(), 'Text');
      setText('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  const uploadFile = async (uri: string, mimeType: string, filename: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as any);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch {}
    return null;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Cho phép app truy cập thư viện ảnh trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const filename = asset.uri.split('/').pop() || 'image.jpg';
        const url = await uploadFile(asset.uri, 'image/jpeg', filename);
        if (url) onSend(url, 'Image');
        else Alert.alert('Lỗi', 'Không thể tải ảnh lên');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Cho phép app dùng camera trong cài đặt.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const filename = `photo_${Date.now()}.jpg`;
        const url = await uploadFile(asset.uri, 'image/jpeg', filename);
        if (url) onSend(url, 'Image');
        else Alert.alert('Lỗi', 'Không thể gửi ảnh');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chụp ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TouchableOpacity style={styles.actionIcon} onPress={pickImage} disabled={isUploading}>
        {isUploading
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <Ionicons name="image" size={26} color={Colors.primary} />}
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionIcon} onPress={openCamera} disabled={isUploading}>
        <Ionicons name="camera" size={26} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Aa"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={handleTextChange}
          onBlur={() => onTypingEnd?.()}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.emojiBtn}>
          <Ionicons name="happy" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {text.trim().length > 0 ? (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={22} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.sendBtn} onPress={() => onSend('👍', 'Text')}>
          <Ionicons name="thumbs-up" size={26} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 10, backgroundColor: Colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
  actionIcon: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  inputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: Colors.surfaceInput, borderRadius: 20,
    marginHorizontal: 8, paddingLeft: 16, paddingRight: 8,
    minHeight: 40, maxHeight: 120,
  },
  input: {
    flex: 1, color: Colors.text, fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8, maxHeight: 120,
  },
  emojiBtn: { padding: 6, marginBottom: 2 },
  sendBtn: {
    width: 36, height: 36, justifyContent: 'center',
    alignItems: 'center', marginBottom: 2, marginRight: 4,
  },
});
