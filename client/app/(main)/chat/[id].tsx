import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useSignalR } from "../../../hooks/useSignalR";

export default function ChatScreen() {
  const { id, name, connectionId } = useLocalSearchParams<{
    id: string;
    name: string;
    connectionId: string;
  }>();

  const { token, userName } = useAuthStore();
  const { messages, sendMessage, callFriend } = useSignalR(token);
  const [inputText, setInputText] = useState("");

  // Lọc tin nhắn của cuộc hội thoại này
  const chatMessages = messages; // useSignalR sẽ được update khi getChatHistory gọi

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;
    await sendMessage(id, inputText.trim());
    setInputText("");
  };

  const handleVideoCall = () => {
    if (!connectionId) return;
    router.push({
      pathname: "/(main)/call/[id]",
      params: { id: connectionId, name, isOutgoing: "true" },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerName}>{name}</Text>
        <TouchableOpacity
          style={[styles.callBtn, !connectionId && styles.callBtnDisabled]}
          onPress={handleVideoCall}
          disabled={!connectionId}
        >
          <Text style={styles.callIcon}>📹</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={chatMessages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isMine = item.senderId !== id;
          return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
              <Text style={styles.bubbleText}>{item.content}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</Text>
        }
      />

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#6b7280"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#2d2d4e",
  },
  backBtn: { padding: 8, marginRight: 8 },
  backIcon: { fontSize: 20, color: "#fff" },
  headerName: { flex: 1, fontSize: 18, fontWeight: "600", color: "#fff" },
  callBtn: {
    backgroundColor: "#7c3aed",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  callBtnDisabled: { backgroundColor: "#4b5563" },
  callIcon: { fontSize: 18 },
  messageList: { padding: 16, flexGrow: 1, justifyContent: "flex-end" },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myBubble: {
    backgroundColor: "#7c3aed",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#1a1a2e",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2d2d4e",
  },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 22 },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 80,
    fontSize: 14,
  },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1a1a2e",
    borderTopWidth: 1,
    borderTopColor: "#2d2d4e",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#0f0f1a",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2d2d4e",
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#7c3aed",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: { color: "#fff", fontSize: 18 },
});
