import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSignalR } from '@shared/hooks/useSignalR';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { ChatInput } from '@features/chat/components/ChatInput';
import { MessageBubble } from '@features/chat/components/MessageBubble';
import { IconButton } from '@shared/components/IconButton';
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

  const handleSend = async (content: string) => {
    if (id) {
      // Optimistic UI for own message
      useChatStore.getState().addMessage(id, {
        senderId: 'ME', // Not actual DB ID, but we know it's ours because it doesn't match otherUser
        content,
        timestamp: Date.now(),
      });
      await sendMessage(id, content);
      
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleVideoCall = async () => {
    if (user?.connectionId && id) {
      await callFriend(user.connectionId);
      router.push(`/call/${id}?name=${name}&connectionId=${user.connectionId}&isCaller=true`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="⬅️" onPress={() => router.back()} backgroundColor="transparent" color={Colors.primary} size={32} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerName}>{name}</Text>
            {isOnline && <Text style={styles.headerStatus}>Active now</Text>}
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton icon="📞" onPress={() => {}} backgroundColor="transparent" color={Colors.primary} size={32} />
          <IconButton 
            icon="📹" 
            onPress={handleVideoCall} 
            backgroundColor="transparent" 
            color={user?.connectionId ? Colors.primary : Colors.textMuted} 
            size={32} 
            style={{ marginLeft: 8 }} 
          />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <Text style={styles.chatHeaderSubtitle}>You're friends on VideoCallApp</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMine = item.senderId !== id; // If not from them, it's mine
            // Check if we should show avatar (if previous message was from me, or it's the first message)
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !isMine && (!prevMessage || prevMessage.senderId !== item.senderId);

            // Is this the very last message in the list and is it mine?
            const isLastMessage = index === messages.length - 1;
            const showSeen = isMine && isLastMessage && item.isSeen;

            return (
              <MessageBubble
                content={item.content}
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
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
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
