import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '@shared/constants/colors';
import { Avatar } from '@shared/components/Avatar';
import { Layout } from '@shared/constants/layout';

interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  showAvatar?: boolean;
  senderName?: string;
  isSeen?: boolean;
}

export function MessageBubble({ content, isMine, showAvatar, senderName, isSeen }: MessageBubbleProps) {
  const isImage = content.startsWith('http') && (content.match(/\.(jpeg|jpg|gif|png)$/) != null || content.includes('/uploads/'));

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.theirsContainer]}>
      {!isMine && (
        <View style={styles.avatarWrap}>
          {showAvatar && <Avatar name={senderName || '?'} size="sm" />}
        </View>
      )}
      <View style={styles.contentWrap}>
        {isImage ? (
          <Image source={{ uri: content }} style={styles.imageBubble} resizeMode="cover" />
        ) : (
          <View style={[styles.bubble, isMine ? styles.mineBubble : styles.theirsBubble]}>
            <Text style={[styles.text, isMine ? styles.mineText : styles.theirsText]}>
              {content}
            </Text>
          </View>
        )}
        {isSeen && (
          <View style={styles.seenContainer}>
            <Avatar name={senderName || '?'} size="sm" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    alignItems: 'flex-end',
  },
  mineContainer: {
    justifyContent: 'flex-end',
  },
  theirsContainer: {
    justifyContent: 'flex-start',
  },
  avatarWrap: {
    width: 28,
    marginRight: 8,
    justifyContent: 'flex-end',
  },
  contentWrap: {
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 18,
  },
  mineBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirsBubble: {
    backgroundColor: Colors.surfaceInput,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  mineText: {
    color: '#FFF',
  },
  theirsText: {
    color: Colors.text,
  },
  seenContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  imageBubble: {
    width: 200,
    height: 250,
    borderRadius: 16,
    backgroundColor: Colors.surfaceInput,
  },
});
