import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  showAvatar?: boolean; // For grouping messages
  senderName?: string;  // First letter of name if avatar is shown
}

export function MessageBubble({ content, isMine, showAvatar = false, senderName = '?' }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isMine ? styles.myContainer : styles.theirContainer]}>
      
      {!isMine && showAvatar && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      
      {!isMine && !showAvatar && <View style={styles.avatarSpacer} />}

      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.text, isMine ? styles.myText : styles.theirText]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: Layout.spacing.lg,
  },
  myContainer: {
    justifyContent: 'flex-end',
  },
  theirContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: Colors.myBubble,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.theirBubble,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: Colors.myBubbleText,
  },
  theirText: {
    color: Colors.theirBubbleText,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarSpacer: {
    width: 28,
    marginRight: 8,
  },
});
