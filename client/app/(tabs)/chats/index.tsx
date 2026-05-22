import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../../store/userStore';
import { useChatStore } from '../../../store/chatStore';
import { useSignalR } from '../../../hooks/useSignalR';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/layout';
import { ConversationItem } from '../../../components/chat/ConversationItem';
import { IconButton } from '../../../components/ui/IconButton';
import { Avatar } from '../../../components/ui/Avatar';

export default function ChatsScreen() {
  const { isConnected } = useSignalR();
  const { users } = useUserStore();
  const { getLastMessage } = useChatStore();

  // "Active Now" bar - Only show online friends
  const activeFriends = users.filter(u => u.isOnline);

  // For chat list, we show all users (in a real app, only those with history)
  // Sorted by last message time if available
  const chatList = [...users].sort((a, b) => {
    const msgA = getLastMessage(a.id);
    const msgB = getLastMessage(b.id);
    const timeA = msgA?.timestamp || 0;
    const timeB = msgB?.timestamp || 0;
    return timeB - timeA;
  });

  const renderActiveFriend = ({ item }: { item: typeof users[0] }) => (
    <TouchableOpacity 
      style={styles.activeFriendContainer}
      onPress={() => router.push(`/(tabs)/chats/${item.id}?name=${item.name}&connectionId=${item.connectionId || ''}`)}
    >
      <Avatar name={item.name} isOnline={true} size="lg" />
      <Text style={styles.activeFriendName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="☰" onPress={() => {}} backgroundColor="transparent" />
          <Text style={styles.headerTitle}>Chats</Text>
          {!isConnected && <Text style={styles.connectingText}>(Connecting...)</Text>}
        </View>
        <View style={styles.headerRight}>
          <IconButton icon="📷" onPress={() => {}} size={36} />
          <IconButton icon="✏️" onPress={() => {}} size={36} style={{ marginLeft: 8 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar Placeholder */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchText}>Search</Text>
          </View>
        </View>

        {/* Active Now Horizontal List */}
        {activeFriends.length > 0 && (
          <View style={styles.activeSection}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={activeFriends}
              keyExtractor={(item) => item.id}
              renderItem={renderActiveFriend}
              contentContainerStyle={styles.activeList}
            />
          </View>
        )}

        {/* Conversations List */}
        <View style={styles.chatListSection}>
          {chatList.map((user) => {
            const lastMsg = getLastMessage(user.id);
            // Format time if lastMsg exists
            let timeStr = '';
            if (lastMsg) {
              const d = new Date(lastMsg.timestamp);
              timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }

            return (
              <ConversationItem
                key={user.id}
                name={user.name}
                isOnline={user.isOnline}
                lastMessage={lastMsg?.content}
                time={timeStr}
                onPress={() => router.push(`/(tabs)/chats/${user.id}?name=${user.name}&connectionId=${user.connectionId || ''}`)}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: 60, // for status bar
    paddingBottom: Layout.spacing.sm,
    backgroundColor: Colors.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: Layout.spacing.sm,
  },
  connectingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.spacing.md,
    height: 36,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: Colors.textSecondary,
  },
  searchText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  activeSection: {
    paddingVertical: Layout.spacing.sm,
  },
  activeList: {
    paddingHorizontal: Layout.spacing.lg,
  },
  activeFriendContainer: {
    alignItems: 'center',
    width: 64,
    marginRight: Layout.spacing.md,
  },
  activeFriendName: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  chatListSection: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xl,
  },
});
