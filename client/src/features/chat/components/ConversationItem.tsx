import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';

interface ConversationItemProps {
  name: string;
  lastMessage?: string;
  time?: string;
  isOnline?: boolean;
  unreadCount?: number;
  isActiveGroupCall?: boolean;
  onJoinGroupCall?: () => void;
  onPress: () => void;
}

export const ConversationItem = React.memo(function ConversationItem({
  name,
  lastMessage,
  time,
  isOnline,
  unreadCount = 0,
  isActiveGroupCall = false,
  onJoinGroupCall,
  onPress,
}: ConversationItemProps) {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar name={name} isOnline={isOnline} size="lg" />

      <View style={styles.content}>
        <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.lastMessage, isUnread && styles.messageUnread]}
            numberOfLines={1}
          >
            {lastMessage || 'Bắt đầu cuộc trò chuyện'}
          </Text>
          {time && (
            <Text style={[styles.time, isUnread && styles.timeUnread]}>
              {' · '}{time}
            </Text>
          )}
        </View>
      </View>

      {isActiveGroupCall ? (
        <TouchableOpacity style={styles.joinButton} onPress={onJoinGroupCall}>
          <Text style={styles.joinButtonText}>Tham gia</Text>
        </TouchableOpacity>
      ) : isUnread ? (
        <View style={styles.unreadBadge} />
      ) : null}
    </TouchableOpacity>
  );
});

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    marginLeft: Layout.spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '400',
    marginBottom: 2,
  },
  nameUnread: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  messageUnread: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeUnread: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Layout.spacing.md,
  },
  joinButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
