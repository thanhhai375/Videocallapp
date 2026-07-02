import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';

interface ConversationItemProps {
  name: string;
  lastMessage?: string;
  time?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onPress: () => void;
}

export const ConversationItem = React.memo(function ConversationItem({
  name,
  lastMessage,
  time,
  isOnline,
  unreadCount = 0,
  onPress,
}: ConversationItemProps) {
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

      {isUnread && (
        <View style={styles.unreadBadge} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeUnread: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#0084FF',
    borderRadius: 8,
    width: 12,
    height: 12,
    marginLeft: Layout.spacing.md,
  },
});
