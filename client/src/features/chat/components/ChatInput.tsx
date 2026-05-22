import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { IconButton } from '@shared/components/IconButton';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export function ChatInput({ onSend, onTypingStart, onTypingEnd }: ChatInputProps) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <View style={styles.container}>
      <IconButton icon="➕" onPress={() => {}} backgroundColor="transparent" color={Colors.primary} size={36} />
      <IconButton icon="📷" onPress={() => {}} backgroundColor="transparent" color={Colors.primary} size={36} />
      <IconButton icon="🖼️" onPress={() => {}} backgroundColor="transparent" color={Colors.primary} size={36} />
      
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
        <IconButton icon="😊" onPress={() => {}} backgroundColor="transparent" size={32} style={styles.emojiBtn} />
      </View>

      {text.trim().length > 0 ? (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      ) : (
        <IconButton icon="👍" onPress={() => onSend('👍')} backgroundColor="transparent" color={Colors.primary} size={36} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 20,
    marginHorizontal: 8,
    paddingLeft: 16,
    paddingRight: 4,
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
    marginBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
});
