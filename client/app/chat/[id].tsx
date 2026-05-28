import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSignalR } from '@shared/hooks/useSignalR';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { ChatInput } from '@features/chat/components/ChatInput';
import { MessageBubble } from '@features/chat/components/MessageBubble';
import { Avatar } from '@shared/components/Avatar';

export default function ChatRoomScreen() {
  const { id, name, connectionId } = useLocalSearchParams<{ id: string, name: string, connectionId: string }>();
  const { userName } = useAuthStore();
  const { getUserById } = useUserStore();
  const { getMessages, typingStatus, markMessageSeen } = useChatStore();
  const { sendMessage, getChatHistory, callFriend, sendTypingStarted, sendTypingEnded, sendMarkMessageSeen } = useSignalR();
  const flatListRef = useRef<FlatList>(null);

  const messages = getMessages(id || '');
  const user = getUserById(id || '');
  const isOnline = user?.isOnline || false;
  const isTyping = typingStatus[id || ''] || false;

  useEffect(() => {
    if (id) {
      getChatHistory(id);
    }
  }, [id]);

  useEffect(() => {
    // Mark last message as seen
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId === id && !lastMsg.isSeen) {
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
      await sendMessage(id, content, type);

      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleVideoCall = async () => {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={30} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Avatar name={name || '?'} isOnline={isOnline} size="sm" />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName}>{name}</Text>
              {isOnline && <Text style={styles.headerStatus}>Đang hoạt động</Text>}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButtonRight} onPress={handleAudioCall}>
            <Ionicons 
              name="call" 
              size={24} 
              color={user?.connectionId ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonRight} onPress={handleVideoCall}>
            <Ionicons 
              name="videocam" 
              size={28} 
              color={user?.connectionId ? Colors.primary : Colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
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
              <Text style={styles.chatHeaderSubtitle}>Các bạn là bạn bè trên VideoCallApp</Text>
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
      </KeyboardAvoidingView>
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
  },
});
