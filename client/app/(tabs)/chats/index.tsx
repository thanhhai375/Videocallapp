import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Alert, Image, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@features/contacts/store/userStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { useSignalR } from '@shared/hooks/useSignalR';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { API_URL } from '@shared/constants/config';
import { ConversationItem } from '@features/chat/components/ConversationItem';
import { Avatar } from '@shared/components/Avatar';

export default function ChatsScreen() {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { isConnected } = useSignalR();
  const { users, getUserById } = useUserStore();
  const { getLastMessage } = useChatStore();
  const messagesState = useChatStore(state => state.messagesByUserId); // Trigger reactive updates on message events
  const { userName, accessToken } = useAuthStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchConversations = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [accessToken, messagesState])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleAddFriend = async () => {
    if (!phoneNumber) return;
    try {
      setIsAdding(true);
      const response = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Thành công', data.message || 'Đã gửi lời mời!');
        setAddModalVisible(false);
        setPhoneNumber('');
      } else {
        Alert.alert('Lỗi', data.message || 'Không tìm thấy người dùng');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
    } finally {
      setIsAdding(false);
    }
  };

  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stories to determine who has a story
    const fetchStories = async () => {
      try {
        const res = await fetch(`${API_URL}/stories`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStories(data);
        }
      } catch (err) {}
    };
    if (accessToken) fetchStories();
  }, [accessToken]);

  const activeFriends = users.filter(u => u.name !== userName);
  const activeListItems = [{ id: 'my-story', isMyStory: true }, ...activeFriends];

  const chatList = conversations
    .filter(c => c.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const msgA = getLastMessage(a.userId);
      const msgB = getLastMessage(b.userId);
      const timeA = msgA ? msgA.timestamp : (a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0);
      const timeB = msgB ? msgB.timestamp : (b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0);
      return timeB - timeA;
    });

  const renderActiveFriend = ({ item }: { item: any }) => {
    if (item.isMyStory) {
      // My Story button
      const myStoryGroup = stories.find(s => s.user.name === userName);
      const hasMyStory = !!myStoryGroup && myStoryGroup.stories.length > 0;
      return (
        <TouchableOpacity
          style={styles.activeFriendContainer}
          onPress={() => {
             router.push({ pathname: '/(tabs)/stories' });
          }}
        >
          <View style={[styles.storyRing, hasMyStory ? styles.storyRingSeen : null]}>
            <View style={{ position: 'relative' }}>
              <Avatar name={userName || '?'} isOnline={false} size="lg" />
              {!hasMyStory && (
                <View style={styles.addStoryBadge}>
                  <Ionicons name="add" size={16} color="#FFF" />
                </View>
              )}
            </View>
          </View>
          <Text style={styles.activeFriendName} numberOfLines={1}>Tin của bạn</Text>
        </TouchableOpacity>
      );
    }

    // Check if this user has a story
    const userStoryGroup = stories.find(s => s.user.id === item.id);
    const hasStory = !!userStoryGroup;
    const hasUnseen = hasStory && userStoryGroup.hasUnseen;

    return (
      <TouchableOpacity
        style={styles.activeFriendContainer}
        onPress={() => {
          if (hasStory) {
             router.push({ pathname: '/(tabs)/stories', params: { openStoryUserId: item.id } });
          } else {
             router.push(`/chat/${item.id}?name=${item.name}&connectionId=${item.connectionId || ''}` as any);
          }
        }}
      >
        <View style={[styles.storyRing, hasUnseen ? styles.storyRingUnseen : (hasStory ? styles.storyRingSeen : null)]}>
          <Avatar name={item.name} isOnline={item.isOnline} size="lg" />
        </View>
        <Text style={styles.activeFriendName} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>messenger</Text>
          {!isConnected && <Text style={styles.connectingText}>(...)</Text>}
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="person-add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Add Friend Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm bạn bè</Text>
            <Text style={styles.modalSubtitle}>Nhập số điện thoại để tìm kiếm</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: 0901111111"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSubmit]} 
                onPress={handleAddFriend}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Tìm & Thêm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Stories Horizontal List */}
        <View style={styles.activeSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={activeListItems}
            keyExtractor={(item: any) => item.id}
            renderItem={renderActiveFriend}
            contentContainerStyle={styles.activeList}
          />
        </View>

        {/* Conversations List */}
        <View style={styles.chatListSection}>
          {chatList.map((c, index) => {
            const lastMsg = getLastMessage(c.userId);
            const content = lastMsg ? lastMsg.content : (c.lastMessage?.content || 'Chưa có tin nhắn');
            
            let timeStr = '';
            const timestamp = lastMsg ? lastMsg.timestamp : (c.lastMessage ? new Date(c.lastMessage.createdAt).getTime() : null);
            if (timestamp) {
              const d = new Date(timestamp);
              timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }

            const isOnline = getUserById(c.userId)?.isOnline ?? c.isOnline;

            return (
              <ConversationItem
                key={c.userId}
                name={c.username}
                isOnline={isOnline}
                lastMessage={content}
                time={timeStr}
                unreadCount={c.unreadCount}
                onPress={() => router.push(`/chat/${c.userId}?name=${c.username}&connectionId=${c.connectionId || ''}&isGroup=${c.isGroup ? 'true' : 'false'}` as any)}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  connectingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: Layout.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    height: '100%',
  },
  activeSection: {
    paddingVertical: Layout.spacing.md,
  },
  activeList: {
    paddingHorizontal: Layout.spacing.lg,
  },
  activeFriendContainer: {
    alignItems: 'center',
    width: 72,
    marginRight: 8,
  },
  activeFriendName: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#3E4042',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storyRingUnseen: {
    borderColor: '#0084FF',
  },
  storyRingSeen: {
    borderColor: Colors.divider,
  },
  chatListSection: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xl,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.bg,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.surfaceInput,
    color: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
  },
  modalBtnSubmit: {
    backgroundColor: Colors.primary,
    minWidth: 100,
  },
  modalBtnCancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnSubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
