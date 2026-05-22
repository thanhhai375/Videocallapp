import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { Avatar } from '../ui/Avatar';

interface ConversationItemProps {
  name: string;
  lastMessage?: string;
  time?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onPress: () => void;
}

export function ConversationItem({
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
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  content: {
    flex: 1,
    marginLeft: Layout.spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  nameUnread: {
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  timeUnread: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: Layout.spacing.md,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
