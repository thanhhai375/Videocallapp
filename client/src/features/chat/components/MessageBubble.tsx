import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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

function AudioPlayer({ url, isMine }: { url: string; isMine: boolean }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePlay = async () => {
    try {
      setLoading(true);
      if (sound) {
        if (playing) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          await sound.playAsync();
          setPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
          }
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={[styles.audioBubble, isMine ? styles.mineBubble : styles.theirsBubble]} onPress={togglePlay}>
      {loading ? (
        <ActivityIndicator size="small" color={isMine ? '#fff' : Colors.primary} />
      ) : (
        <Ionicons
          name={playing ? 'pause-circle' : 'play-circle'}
          size={32}
          color={isMine ? '#fff' : Colors.primary}
        />
      )}
      <View style={styles.audioWaveform}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height: 4 + Math.random() * 16 },
              { backgroundColor: isMine ? 'rgba(255,255,255,0.8)' : Colors.primary }
            ]}
          />
        ))}
      </View>
      <Text style={[styles.audioLabel, { color: isMine ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>
        🎤 Ghi âm
      </Text>
    </TouchableOpacity>
  );
}

export function MessageBubble({ content, messageType, isMine, showAvatar, senderName, isSeen }: MessageBubbleProps) {
  // Auto-detect type if not provided
  const isImage = messageType === 'Image' ||
    (content.startsWith('http') && (content.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/) != null || content.includes('/uploads/')));
  const isAudio = messageType === 'Audio' ||
    (content.startsWith('http') && content.match(/\.(mp3|m4a|aac|wav|ogg)($|\?)/) != null);

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
          <AudioPlayer url={content} isMine={isMine} />
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
    flexDirection: 'row', marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm, alignItems: 'flex-end',
  },
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
  audioBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, minWidth: 180,
  },
  audioWaveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  waveBar: { width: 3, borderRadius: 2, opacity: 0.7 },
  audioLabel: { fontSize: 12 },
});
