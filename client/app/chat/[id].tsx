import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSignalR } from '@shared/hooks/useSignalR';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { ChatInput } from '@features/chat/components/ChatInput';
import { MessageBubble } from '@features/chat/components/MessageBubble';
import { Avatar } from '@shared/components/Avatar';
import { API_URL } from '@shared/constants/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatRoomScreen() {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const insets = useSafeAreaInsets();
  const { id, name, connectionId, isGroup } = useLocalSearchParams<{ id: string, name: string, connectionId: string, isGroup?: string }>();
  const isGroupBool = isGroup === 'true';
  const { userName, accessToken } = useAuthStore();
  const { getUserById } = useUserStore();
  const { getMessages, typingStatus, markMessageSeen } = useChatStore();
  const [isCallActive, setIsCallActive] = useState(false);
  const { 
    sendMessage, 
    getChatHistory, 
    callFriend, 
    sendTypingStarted, 
    sendTypingEnded, 
    sendMarkMessageSeen,
    checkActiveGroupCall,
    setOnGroupCallStarted,
    setOnGroupCallEnded
  } = useSignalR();
  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Group Call Active State
  useEffect(() => {
    if (isGroupBool && id) {
      checkActiveGroupCall(id).then(setIsCallActive);

      setOnGroupCallStarted((groupId) => {
        if (groupId === id) setIsCallActive(true);
      });
      setOnGroupCallEnded((groupId) => {
        if (groupId === id) setIsCallActive(false);
      });
    }
  }, [id, isGroupBool]);

  const messages = getMessages(id || '');
  const user = getUserById(id || '');
  const isOnline = isGroupBool ? true : (user?.isOnline || false);
  const isTyping = typingStatus[id || ''] || false;

  useEffect(() => {
    if (id) {
      getChatHistory(id);
    }
  }, [id]);

  useEffect(() => {
    // Mark last message as seen
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId !== 'ME' && !lastMsg.isSeen) {
      markMessageSeen(id, lastMsg.id);
      sendMarkMessageSeen(id, lastMsg.id);
    }
  }, [messages.length, id]);

  const handleSend = async (content: string, type: 'Text' | 'Image' | 'Audio' = 'Text') => {
    if (id) {
      // Optimistic UI for own message
      useChatStore.getState().addMessage(id, {
        senderId: 'ME',
        content,
        messageType: type,
        timestamp: Date.now(),
      });
      await sendMessage(id, content, type, isGroupBool);

      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleVideoCall = async () => {
    if (isGroupBool) {
      if (id) {
        router.push(`/call/group?groupId=${id}&name=${name}&isInitiator=${!isCallActive}`);
      }
      return;
    }

    if (user?.connectionId && id) {
      await callFriend(user.connectionId);
      router.push(`/call/${id}?name=${name}&connectionId=${user.connectionId}&isCaller=true`);
    } else {
      Alert.alert('Không thể gọi', 'Người dùng này đang ngoại tuyến.');
    }
  };

  const handleAudioCall = async () => {
    if (user?.connectionId && id) {
      await callFriend(user.connectionId, 'Audio');
      router.push(`/call/${id}?name=${name}&connectionId=${user.connectionId}&isCaller=true`);
    } else {
      Alert.alert('Không thể gọi', 'Người dùng này đang ngoại tuyến.');
    }
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Chặn người dùng',
      `Bạn có chắc chắn muốn chặn ${name}? Bạn sẽ không nhận được tin nhắn từ người này nữa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/friends/block/${id}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              if (res.ok) {
                Alert.alert('Thành công', 'Đã chặn người dùng này.');
                router.back();
              } else {
                const errData = await res.json();
                Alert.alert('Lỗi', errData.message || 'Không thể chặn người dùng.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            }
          }
        }
      ]
    );
  };

  const handleAddFriendDirectly = async () => {
    try {
      const res = await fetch(`${API_URL}/friends/request-by-id/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thành công', data.message || 'Đã gửi lời mời kết bạn!');
      } else {
        Alert.alert('Thông báo', data.message || 'Không thể gửi lời mời.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Lỗi kết nối.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={30} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerTitleContainer}
            onPress={() => router.push(`/chat/settings/${id}?name=${name}&isGroup=${isGroupBool}`)}
          >
            <Avatar name={name || '?'} isOnline={isOnline} size="sm" />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName}>{name}</Text>
              {isOnline && !isGroupBool && <Text style={styles.headerStatus}>Đang hoạt động</Text>}
              {isGroupBool && <Text style={styles.headerStatus}>Nhóm trò chuyện</Text>}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButtonRight} onPress={handleAudioCall}>
            <Ionicons 
              name="call" 
              size={24} 
              color={user?.connectionId || isGroupBool ? Colors.primary : Colors.textMuted} 
              disabled={!user?.connectionId && !isGroupBool}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonRight} onPress={handleVideoCall}>
            <Ionicons 
              name="videocam" 
              size={28} 
              color={user?.connectionId || isGroupBool ? Colors.primary : Colors.textMuted} 
              disabled={!user?.connectionId && !isGroupBool}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isGroupBool && isCallActive && (
        <TouchableOpacity 
          style={{
            backgroundColor: '#4CAF50',
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onPress={() => router.push(`/call/group?groupId=${id}&name=${name}&isInitiator=false`)}
        >
          <Ionicons name="videocam" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cuộc gọi nhóm đang diễn ra - Tham gia ngay</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View style={styles.chatHeaderInfo}>
              <Avatar name={name || '?'} size="xl" />
              <Text style={styles.chatHeaderName}>{name}</Text>
              
              {!isGroupBool ? (
                <>
                  <Text style={styles.chatHeaderSubtitle}>
                    {user ? 'Các bạn là bạn bè trên VideoCallApp' : 'Người này chưa có trong danh sách bạn bè của bạn'}
                  </Text>
                  {!user && (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.surfaceElevated }]}
                        onPress={handleBlockUser}
                      >
                        <Ionicons name="ban-outline" size={16} color={Colors.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14 }}>Chặn / Spam</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                        onPress={handleAddFriendDirectly}
                      >
                        <Ionicons name="person-add-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Kết bạn</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.chatHeaderSubtitle}>Nhóm trò chuyện</Text>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const isMine = item.senderId !== id; 
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !isMine && (!prevMessage || prevMessage.senderId !== item.senderId);
            const isLastMessage = index === messages.length - 1;
            const showSeen = isMine && isLastMessage && item.isSeen;

            return (
              <MessageBubble
                content={item.content}
                messageType={item.messageType}
                isMine={isMine}
                showAvatar={showAvatar}
                senderName={name}
                isSeen={showSeen}
              />
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={{ paddingHorizontal: Layout.spacing.lg, marginTop: 8 }}>
                <MessageBubble content="💬" isMine={false} showAvatar={true} senderName={name} />
              </View>
            ) : null
          }
        />

        <ChatInput 
          onSend={handleSend} 
          onTypingStart={() => { if (id) sendTypingStarted(id); }}
          onTypingEnd={() => { if (id) sendTypingEnded(id); }}
        />
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: Layout.spacing.sm,
    paddingTop: 50,
    paddingBottom: Layout.spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTextWrap: {
    marginLeft: 8,
  },
  headerName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButtonRight: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  messageList: {
    paddingVertical: Layout.spacing.md,
  },
  chatHeaderInfo: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxl,
    marginBottom: Layout.spacing.xl,
  },
  chatHeaderName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: Layout.spacing.md,
  },
  chatHeaderSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
