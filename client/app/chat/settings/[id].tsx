import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@shared/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { API_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';
import { Avatar } from '@shared/components/Avatar';

export default function ChatSettingsScreen() {
  const { id, name, isGroup } = useLocalSearchParams();
  const router = useRouter();
  const Colors = useTheme();
  const { accessToken } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const isGroupBool = isGroup === 'true';

  useEffect(() => {
    if (isGroupBool && id) {
      setLoadingMembers(true);
      fetch(`${API_URL}/chat/group/${id}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setMembers(data);
        } else {
          setMembers([]);
          console.error("API did not return an array:", data);
        }
      })
      .catch(err => console.error("Fetch members error:", err))
      .finally(() => setLoadingMembers(false));
    }
  }, [id, isGroupBool, accessToken]);

  const handleDeleteChat = () => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc chắn muốn xóa toàn bộ tin nhắn này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/chat/history/${id}?isGroup=${isGroupBool}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (res.ok) {
                Alert.alert('Thành công', 'Đã xóa cuộc trò chuyện.');
                router.replace('/(tabs)/chats');
              } else {
                Alert.alert('Lỗi', 'Không thể xóa cuộc trò chuyện.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            }
          }
        }
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Rời khỏi nhóm',
      'Bạn có chắc chắn muốn rời khỏi nhóm này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Rời nhóm', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/chat/group/${id}/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (res.ok) {
                Alert.alert('Thành công', 'Đã rời nhóm.');
                router.replace('/(tabs)/chats');
              } else {
                const errText = await res.text();
                Alert.alert('Lỗi', errText || 'Không thể rời nhóm.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[localStyles.container, { backgroundColor: Colors.bg }]} edges={['top', 'bottom']}>
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={localStyles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[localStyles.title, { color: Colors.text }]}>Tùy chọn đoạn chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={localStyles.profileSection}>
          <View style={localStyles.avatarLarge}>
            <Text style={localStyles.avatarInitial}>{name ? name[0]?.toUpperCase() : '?'}</Text>
          </View>
          <Text style={[localStyles.profileName, { color: Colors.text }]}>{name}</Text>
        </View>

        <View style={localStyles.actionsList}>
          {!isGroupBool && (
            <TouchableOpacity 
              style={localStyles.actionItem} 
              onPress={() => router.push(`/chat/create-group?userId=${id}&name=${name}`)}
            >
              <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <Ionicons name="people-outline" size={24} color={Colors.text} />
              </View>
              <Text style={[localStyles.actionText, { color: Colors.text }]}>Tạo nhóm với {name}</Text>
            </TouchableOpacity>
          )}

          {isGroupBool && (
            <TouchableOpacity style={localStyles.actionItem}>
              <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <Ionicons name="person-add-outline" size={24} color={Colors.text} />
              </View>
              <Text style={[localStyles.actionText, { color: Colors.text }]}>Thêm thành viên</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={localStyles.actionItem}>
            <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="search-outline" size={24} color={Colors.text} />
            </View>
            <Text style={[localStyles.actionText, { color: Colors.text }]}>Tìm kiếm tin nhắn</Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.actionItem}>
            <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="color-palette-outline" size={24} color={Colors.text} />
            </View>
            <Text style={[localStyles.actionText, { color: Colors.text }]}>Chủ đề</Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.actionItem}>
            <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="happy-outline" size={24} color={Colors.text} />
            </View>
            <Text style={[localStyles.actionText, { color: Colors.text }]}>Biểu tượng cảm xúc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.actionItem}>
            <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="notifications-off-outline" size={24} color={Colors.text} />
            </View>
            <Text style={[localStyles.actionText, { color: Colors.text }]}>Tắt thông báo</Text>
          </TouchableOpacity>

          {!isGroupBool && (
            <TouchableOpacity style={localStyles.actionItem}>
              <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <Ionicons name="person-outline" size={24} color={Colors.text} />
              </View>
              <Text style={[localStyles.actionText, { color: Colors.text }]}>Xem trang cá nhân</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={localStyles.actionItem} onPress={handleDeleteChat}>
            <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="trash-outline" size={24} color="#ff3b30" />
            </View>
            <Text style={[localStyles.actionText, { color: "#ff3b30" }]}>Xóa cuộc trò chuyện</Text>
          </TouchableOpacity>

          {!isGroupBool ? (
            <TouchableOpacity style={localStyles.actionItem}>
              <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <Ionicons name="ban-outline" size={24} color="#ff3b30" />
              </View>
              <Text style={[localStyles.actionText, { color: "#ff3b30" }]}>Chặn</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={localStyles.actionItem} onPress={handleLeaveGroup}>
              <View style={[localStyles.actionIcon, { backgroundColor: Colors.surfaceElevated }]}>
                <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
              </View>
              <Text style={[localStyles.actionText, { color: "#ff3b30" }]}>Rời khỏi nhóm</Text>
            </TouchableOpacity>
          )}
        </View>

        {isGroupBool && (
          <View style={localStyles.membersSection}>
            <Text style={[localStyles.sectionTitle, { color: Colors.textMuted }]}>
              Thành viên nhóm ({members.length})
            </Text>
            {loadingMembers ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 10 }} />
            ) : (
              members.map(member => (
                <View key={member.id} style={localStyles.memberItem}>
                  <Avatar name={member.username} isOnline={member.isOnline} size="sm" />
                  <View style={localStyles.memberInfo}>
                    <Text style={[localStyles.memberName, { color: Colors.text }]}>{member.username}</Text>
                    <Text style={localStyles.memberRole}>{member.role === 'Admin' ? 'Trưởng nhóm' : 'Thành viên'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: '600' },
  profileSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 15
  },
  avatarInitial: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  profileName: { fontSize: 24, fontWeight: 'bold' },
  actionsList: { paddingHorizontal: 20 },
  actionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 15
  },
  actionText: { fontSize: 16, fontWeight: '500' },
  membersSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberInfo: {
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  }
});
