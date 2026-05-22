import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export function ChatInput({ onSend, onTypingStart, onTypingEnd }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (newText.trim().length > 0) {
      onTypingStart?.();
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingEnd?.();
      }, 2000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  const handleComingSoon = () => {
    Alert.alert('Thông báo', 'Tính năng này đang được phát triển!');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'image.jpg';
        
        // Ensure formData is typed correctly for react-native
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type: 'image/jpeg'
        } as any);

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Send the image URL as a message
          onSend(data.url);
        } else {
          Alert.alert('Lỗi', 'Không thể tải ảnh lên máy chủ.');
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TouchableOpacity style={styles.actionIcon} onPress={handleComingSoon}>
        <Ionicons name="add-circle" size={28} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionIcon} onPress={handleComingSoon}>
        <Ionicons name="camera" size={26} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionIcon} onPress={pickImage} disabled={isUploading}>
        {isUploading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="image" size={26} color={Colors.primary} />
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionIcon} onPress={handleComingSoon}>
        <Ionicons name="mic" size={26} color={Colors.primary} />
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
        <TouchableOpacity style={styles.emojiBtn} onPress={handleComingSoon}>
          <Ionicons name="happy" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {text.trim().length > 0 ? (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.sendBtn} onPress={() => onSend('👍')}>
          <Ionicons name="thumbs-up" size={26} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 10,
    backgroundColor: Colors.bg,
  },
  actionIcon: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 20,
    marginHorizontal: 8,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
  },
  emojiBtn: {
    padding: 6,
    marginBottom: 2,
  },
  sendBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginRight: 4,
  },
});
