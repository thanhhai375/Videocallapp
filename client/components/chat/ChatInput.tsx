import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { IconButton } from '../ui/IconButton';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
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
          onChangeText={setText}
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
