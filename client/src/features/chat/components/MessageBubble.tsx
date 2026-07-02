/* eslint-disable */
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Colors } from "@shared/constants/colors";
import { Avatar } from "@shared/components/Avatar";
import { Layout } from "@shared/constants/layout";

interface MessageBubbleProps {
  content: string;
  messageType?: "Text" | "Image" | "Audio";
  isMine: boolean;
  showAvatar?: boolean;
  senderName?: string;
  isSeen?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  content,
  messageType,
  isMine,
  showAvatar,
  senderName,
  isSeen,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  // Auto-detect type
  const isImage =
    messageType === "Image" ||
    (content.startsWith("http") &&
      (content.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/) != null ||
        content.includes("/uploads/")));

  const isAudio =
    messageType === "Audio" ||
    (content.startsWith("http") &&
      content.match(/\.(mp3|m4a|aac|wav|ogg)(\?|$)/) != null);

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.mineContainer : styles.theirsContainer,
        { marginBottom: isLastInGroup ? Layout.spacing.sm : 2 },
      ]}
    >
      {!isMine && (
        <View style={styles.avatarWrap}>
          {showAvatar && <Avatar name={senderName || "?"} size="sm" />}
        </View>
      )}
      <View style={styles.contentWrap}>
        {isImage ? (
          <Image
            source={{ uri: content }}
            style={styles.imageBubble}
            resizeMode="cover"
          />
        ) : isAudio ? (
          <AudioBubbleContent uri={content} isMine={isMine} isFirstInGroup={isFirstInGroup} isLastInGroup={isLastInGroup} />
        ) : (
          <View
            style={[
              styles.bubble,
              isMine ? styles.mineBubble : styles.theirsBubble,
              isMine
                ? {
                    borderTopRightRadius: isFirstInGroup ? 18 : 4,
                    borderBottomRightRadius: isLastInGroup ? 18 : 4,
                  }
                : {
                    borderTopLeftRadius: isFirstInGroup ? 18 : 4,
                    borderBottomLeftRadius: isLastInGroup ? 18 : 4,
                  },
            ]}
          >
            <Text
              style={[
                styles.text,
                isMine ? styles.mineText : styles.theirsText,
              ]}
            >
              {content}
            </Text>
          </View>
        )}
        {isSeen && (
          <View style={styles.seenContainer}>
            <Avatar name={senderName || "?"} size="sm" />
          </View>
        )}
      </View>
    </View>
  );
});

function AudioBubbleContent({ uri, isMine, isFirstInGroup = true, isLastInGroup = true }: { uri: string; isMine: boolean; isFirstInGroup?: boolean; isLastInGroup?: boolean }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const duration = status.duration || 1;
  const position = status.currentTime || 0;
  const progress = Math.min(position / duration, 1);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (position >= duration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.audioBubble,
        isMine ? styles.mineBubble : styles.theirsBubble,
        isMine
          ? {
              borderTopRightRadius: isFirstInGroup ? 18 : 4,
              borderBottomRightRadius: isLastInGroup ? 18 : 4,
            }
          : {
              borderTopLeftRadius: isFirstInGroup ? 18 : 4,
              borderBottomLeftRadius: isLastInGroup ? 18 : 4,
            },
      ]}
      onPress={togglePlay}
    >
      <Ionicons
        name={isPlaying ? "pause-circle" : "play-circle"}
        size={32}
        color={isMine ? "#fff" : Colors.primary}
      />
      <View style={styles.audioWaveContainer}>
        <View
          style={[
            styles.audioWaveProgress,
            {
              width: `${progress * 100}%`,
              backgroundColor: isMine ? "#fff" : Colors.primary,
            },
          ]}
        />
        <View style={styles.audioWaveBg}>
          {[...Array(10)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 4 + (i % 3) * 6,
                  backgroundColor: isMine
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,122,255,0.2)",
                },
              ]}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    alignItems: "flex-end",
  },
  mineContainer: { justifyContent: "flex-end" },
  theirsContainer: { justifyContent: "flex-start" },
  avatarWrap: { width: 28, marginRight: 8, justifyContent: "flex-end" },
  contentWrap: { maxWidth: "75%" },
  bubble: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 18,
  },
  mineBubble: { backgroundColor: Colors.primary },
  theirsBubble: {
    backgroundColor: Colors.surfaceInput,
  },
  text: { fontSize: 16, lineHeight: 22 },
  mineText: { color: "#FFF" },
  theirsText: { color: Colors.text },
  seenContainer: { alignSelf: "flex-end", marginTop: 4 },
  imageBubble: {
    width: 220,
    height: 270,
    borderRadius: 16,
    backgroundColor: Colors.surfaceInput,
  },
  audioBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 160,
  },
  audioWaveContainer: {
    flex: 1,
    height: 20,
    justifyContent: "center",
    overflow: "hidden",
  },
  audioWaveBg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    position: "absolute",
  },
  audioWaveProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.3,
  },
  waveBar: { width: 3, borderRadius: 2 },
  audioLabel: { fontSize: 14 },
});
