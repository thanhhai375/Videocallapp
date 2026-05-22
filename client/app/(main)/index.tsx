import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useSignalR, Friend } from "../../hooks/useSignalR";

export default function FriendListScreen() {
  const { token, userName, logout } = useAuthStore();
  const { isConnected, friends } = useSignalR(token);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() =>
        router.push({
          pathname: "/(main)/chat/[id]",
          params: { id: item.id, name: item.name, connectionId: item.connectionId ?? "" },
        })
      }
    >
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={[styles.statusDot, item.isOnline ? styles.online : styles.offline]} />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={[styles.friendStatus, item.isOnline ? styles.statusOnline : styles.statusOffline]}>
          {item.isOnline ? "Đang hoạt động" : "Offline"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào, {userName} 👋</Text>
          <Text style={styles.connectionStatus}>
            {isConnected ? "🟢 Đã kết nối" : "🔴 Đang kết nối..."}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {!isConnected ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Đang kết nối đến server...</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có người dùng nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 48,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2d2d4e",
  },
  welcomeText: { fontSize: 18, fontWeight: "600", color: "#fff" },
  connectionStatus: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  list: { padding: 16 },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2d2d4e",
  },
  avatarWrapper: { position: "relative", marginRight: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#1a1a2e",
  },
  online: { backgroundColor: "#22c55e" },
  offline: { backgroundColor: "#6b7280" },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: "600", color: "#fff" },
  friendStatus: { fontSize: 13, marginTop: 2 },
  statusOnline: { color: "#22c55e" },
  statusOffline: { color: "#6b7280" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#9ca3af", marginTop: 16, fontSize: 14 },
  emptyText: { textAlign: "center", color: "#6b7280", marginTop: 40 },
});
