import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSignalR } from '../../../../hooks/useSignalR';
import { useChatStore } from '../../../../store/chatStore';
import { useAuthStore } from '../../../../store/authStore';
import { useUserStore } from '../../../../store/userStore';
import { Colors } from '../../../../constants/colors';
import { Layout } from '../../../../constants/layout';
import { ChatInput } from '../../../../components/chat/ChatInput';
import { MessageBubble } from '../../../../components/chat/MessageBubble';
import { IconButton } from '../../../../components/ui/IconButton';
import { Avatar } from '../../../../components/ui/Avatar';

export default function ChatRoomScreen() {
  const { id, name, connectionId } = useLocalSearchParams<{ id: string, name: string, connectionId: string }>();
  const { userName } = useAuthStore();
  const { getUserById } = useUserStore();
  const { getMessages } = useChatStore();
  const { sendMessage, getChatHistory } = useSignalR();
  const flatListRef = useRef<FlatList>(null);

  const messages = getMessages(id || '');
  const user = getUserById(id || '');
  const isOnline = user?.isOnline || false;

  useEffect(() => {
    if (id) {
      getChatHistory(id);
    }
  }, [id]);

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

  const handleVideoCall = () => {
    if (user?.connectionId) {
      // Navigate to call screen (we'll implement this later)
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

            return (
              <MessageBubble
                content={item.content}
                isMine={isMine}
                showAvatar={showAvatar}
                senderName={name}
              />
            );
          }}
        />

        <ChatInput onSend={handleSend} />
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
