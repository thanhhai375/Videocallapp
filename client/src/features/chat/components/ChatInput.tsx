import React, { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator, Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors } from '@shared/constants/colors';
import { API_URL, SERVER_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';

interface ChatInputProps {
  onSend: (message: string, type?: 'Text' | 'Image' | 'Audio') => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export function ChatInput({ onSend, onTypingStart, onTypingEnd }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

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

  // Upload file and return URL
  const uploadFile = async (uri: string, mimeType: string, filename: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as any);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  // Pick image from gallery
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
    } catch { Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh'); }
    finally { setIsUploading(false); }
  };

  // Open camera
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
    } catch { Alert.alert('Lỗi', 'Có lỗi xảy ra khi chụp ảnh'); }
    finally { setIsUploading(false); }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Cho phép app dùng microphone trong cài đặt.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch { Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm'); }
  };

  // Stop recording and upload
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      clearInterval(durationTimerRef.current!);
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) {
        setIsUploading(true);
        const filename = `voice_${Date.now()}.m4a`;
        const url = await uploadFile(uri, 'audio/m4a', filename);
        if (url) onSend(url, 'Audio');
        else Alert.alert('Lỗi', 'Không thể gửi ghi âm');
      }
    } catch { Alert.alert('Lỗi', 'Lỗi khi dừng ghi âm'); }
    finally { setIsUploading(false); setRecordingDuration(0); }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {isRecording ? (
        // Recording mode UI
        <View style={styles.recordingBar}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Đang ghi âm... {formatDuration(recordingDuration)}</Text>
          <TouchableOpacity style={styles.stopRecordBtn} onPress={stopRecording}>
            <Ionicons name="stop-circle" size={32} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => onSend('👍', 'Text')}
              onLongPress={startRecording}
            >
              <Ionicons name="mic" size={26} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </>
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
  // Recording UI
  recordingBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceInput, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 8, margin: 4,
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.danger, marginRight: 10,
  },
  recordingText: { flex: 1, color: Colors.text, fontSize: 15 },
  stopRecordBtn: { padding: 4 },
});
