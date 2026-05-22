import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@shared/constants/colors';
import { Avatar } from '@shared/components/Avatar';
import { Layout } from '@shared/constants/layout';

interface MessageBubbleProps {
  content: string;
  messageType?: 'Text' | 'Image' | 'Audio';
  isMine: boolean;
  showAvatar?: boolean;
  senderName?: string;
  isSeen?: boolean;
}

export function MessageBubble({ content, messageType, isMine, showAvatar, senderName, isSeen }: MessageBubbleProps) {
  // Auto-detect type
  const isImage = messageType === 'Image' ||
    (content.startsWith('http') && (
      content.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/) != null ||
      content.includes('/uploads/')
    ));

  const isAudio = messageType === 'Audio' ||
    (content.startsWith('http') && content.match(/\.(mp3|m4a|aac|wav|ogg)(\?|$)/) != null);

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
        ) : isAudio ? (
          <TouchableOpacity style={[styles.audioBubble, isMine ? styles.mineBubble : styles.theirsBubble]}>
            <Ionicons name="play-circle" size={32} color={isMine ? '#fff' : Colors.primary} />
            <View style={styles.audioWave}>
              {[...Array(10)].map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 4 + (i % 3) * 6, backgroundColor: isMine ? 'rgba(255,255,255,0.7)' : Colors.primary }]} />
              ))}
            </View>
            <Text style={[styles.audioLabel, { color: isMine ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>🎤</Text>
          </TouchableOpacity>
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
  container: { flexDirection: 'row', marginBottom: Layout.spacing.sm, paddingHorizontal: Layout.spacing.sm, alignItems: 'flex-end' },
  mineContainer: { justifyContent: 'flex-end' },
  theirsContainer: { justifyContent: 'flex-start' },
  avatarWrap: { width: 28, marginRight: 8, justifyContent: 'flex-end' },
  contentWrap: { maxWidth: '75%' },
  bubble: { paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm, borderRadius: 18 },
  mineBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirsBubble: { backgroundColor: Colors.surfaceInput, borderBottomLeftRadius: 4 },
  text: { fontSize: 16, lineHeight: 22 },
  mineText: { color: '#FFF' },
  theirsText: { color: Colors.text },
  seenContainer: { alignSelf: 'flex-end', marginTop: 4 },
  imageBubble: { width: 220, height: 270, borderRadius: 16, backgroundColor: Colors.surfaceInput },
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, minWidth: 160 },
  audioWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 20 },
  waveBar: { width: 3, borderRadius: 2 },
  audioLabel: { fontSize: 14 },
});
